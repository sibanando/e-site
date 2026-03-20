import { Router, Request, Response } from 'express';
import { z } from 'zod';
import path from 'path';
import fs from 'fs/promises';
import pool from '../db/pool';
import { authenticate } from '../middleware/auth';
import { requireRoles, ROLES } from '../middleware/rbac';
import { logAudit } from '../middleware/audit';
import { generateToken, renderTemplate, generateQRCode, generatePDF, ensureCertDir } from '../utils/pdf';

const router = Router();
router.use(authenticate);

// GET /certificate-templates
router.get('/templates', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT ct.*, st.name as sacrament_name, st.code as sacrament_code
       FROM certificate_templates ct
       JOIN sacrament_types st ON ct.sacrament_type_id = st.id
       WHERE ct.parish_id = $1
       ORDER BY st.sequence_order`,
      [req.user!.parishId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /certificate-templates
router.post('/templates', requireRoles(ROLES.ADMIN, ROLES.CLERK), async (req: Request, res: Response): Promise<void> => {
  const schema = z.object({
    sacramentTypeId: z.string().uuid(),
    name: z.string().min(1),
    htmlTemplate: z.string().min(10),
    isDefault: z.boolean().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() }); return; }

  const { sacramentTypeId, name, htmlTemplate, isDefault } = parsed.data;
  try {
    const result = await pool.query(
      `INSERT INTO certificate_templates (parish_id, sacrament_type_id, name, html_template, is_default)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user!.parishId, sacramentTypeId, name, htmlTemplate, isDefault ?? false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /certificate-templates/:id
router.put('/templates/:id', requireRoles(ROLES.ADMIN, ROLES.CLERK), async (req: Request, res: Response): Promise<void> => {
  const schema = z.object({
    name: z.string().min(1).optional(),
    htmlTemplate: z.string().min(10).optional(),
    isDefault: z.boolean().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() }); return; }

  const { name, htmlTemplate, isDefault } = parsed.data;
  try {
    const result = await pool.query(
      `UPDATE certificate_templates SET
         name = COALESCE($1, name),
         html_template = COALESCE($2, html_template),
         is_default = COALESCE($3, is_default),
         updated_at = NOW()
       WHERE id = $4 AND parish_id = $5 RETURNING *`,
      [name, htmlTemplate, isDefault, req.params.id, req.user!.parishId]
    );
    if (!result.rows[0]) { res.status(404).json({ error: 'Template not found' }); return; }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /certificates — generate certificate PDF
router.post('/', requireRoles(ROLES.ADMIN, ROLES.CLERK, ROLES.PRIEST), async (req: Request, res: Response): Promise<void> => {
  const schema = z.object({
    personId: z.string().uuid(),
    sacramentId: z.string().uuid(),
    templateId: z.string().uuid().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() }); return; }

  const { personId, sacramentId, templateId } = parsed.data;

  try {
    // Get sacrament record with person info + parish logo
    const sacramentRes = await pool.query(
      `SELECT s.*, st.code, st.name as sacrament_name,
              p.first_name, p.last_name, p.dob,
              par.name as parish_name, par.address as parish_address, par.logo_path,
              json_agg(json_build_object('name', sp.name, 'role', sp.role)) FILTER (WHERE sp.id IS NOT NULL) as sponsors
       FROM sacraments s
       JOIN sacrament_types st ON s.sacrament_type_id = st.id
       JOIN people p ON s.person_id = p.id
       JOIN parishes par ON s.parish_id = par.id
       LEFT JOIN sacrament_sponsors sp ON s.id = sp.sacrament_id
       WHERE s.id = $1 AND s.person_id = $2 AND s.status = 'completed'
       GROUP BY s.id, st.code, st.name, p.first_name, p.last_name, p.dob, par.name, par.address, par.logo_path`,
      [sacramentId, personId]
    );

    if (!sacramentRes.rows[0]) {
      res.status(404).json({ error: 'Sacrament record not found or not completed' });
      return;
    }
    const sacrament = sacramentRes.rows[0];

    // Get template — fall back to any template for this type, then generic
    let templateRes;
    if (templateId) {
      templateRes = await pool.query('SELECT * FROM certificate_templates WHERE id = $1', [templateId]);
    } else {
      templateRes = await pool.query(
        `SELECT * FROM certificate_templates
         WHERE parish_id = $1 AND sacrament_type_id = $2
         ORDER BY is_default DESC LIMIT 1`,
        [req.user!.parishId, sacrament.sacrament_type_id]
      );
    }

    // Build a generic template if none exists for this sacrament type
    const genericHtml = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Georgia, serif; text-align: center; padding: 40px; color: #1a1a1a; }
    .header { border-bottom: 3px double #8B6914; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { width: 100px; height: 100px; object-fit: contain; margin-bottom: 12px; }
    h1 { color: #102a43; font-size: 2em; margin: 0 0 8px; }
    h2 { color: #8B6914; font-size: 1.4em; margin: 0; }
    .person { font-size: 1.6em; font-weight: bold; color: #102a43; margin: 20px 0; }
    .details { max-width: 520px; margin: 0 auto; text-align: left; font-size: 0.95em; line-height: 2; }
    .details td:first-child { color: #666; width: 160px; }
    .footer { margin-top: 50px; border-top: 2px solid #8B6914; padding-top: 24px; font-size: 0.85em; color: #555; }
    .sig { display: inline-block; border-top: 1px solid #333; min-width: 180px; margin: 0 30px; padding-top: 6px; }
    .qr { margin-top: 16px; }
  </style>
</head>
<body>
  <div class="header">
    {{logo_img}}
    <h1>{{parish_name}}</h1>
    <h2>Certificate of {{sacrament_name}}</h2>
    <p style="color:#666;font-size:0.9em">{{parish_address}}</p>
  </div>
  <p>This is to certify that</p>
  <div class="person">{{person_name}}</div>
  <p>received the Sacrament of <strong>{{sacrament_name}}</strong></p>
  <table class="details" cellspacing="0">
    <tr><td>Date:</td><td><strong>{{sacrament_date}}</strong></td></tr>
    <tr><td>Place:</td><td><strong>{{place}}</strong></td></tr>
    <tr><td>Celebrant:</td><td><strong>{{celebrant}}</strong></td></tr>
    <tr><td>Sponsor(s):</td><td><strong>{{sponsors}}</strong></td></tr>
    <tr><td>Register:</td><td>Vol. <strong>{{register_volume}}</strong>, Pg. <strong>{{register_page}}</strong></td></tr>
  </table>
  <div class="footer">
    <div><span class="sig">Parish Priest</span><span class="sig">Parish Secretary</span></div>
    <div class="qr">{{qr_code}}</div>
    <p style="font-size:0.8em;color:#888">Verify at: {{verification_url}}</p>
  </div>
</body>
</html>`;

    const template = templateRes.rows[0] ?? {
      id: null,
      html_template: genericHtml,
    };

    // Generate QR token
    const qrToken = generateToken();
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify/${qrToken}`;
    const qrDataUrl = await generateQRCode(verifyUrl);

    // Render HTML
    const sponsors = (sacrament.sponsors || []).map((sp: { name: string; role: string }) => `${sp.name} (${sp.role})`).join(', ');
    const logoImg = sacrament.logo_path
      ? `<img src="${sacrament.logo_path}" class="logo" alt="Parish Logo" />`
      : '';

    const html = renderTemplate(template.html_template, {
      parish_name: sacrament.parish_name,
      parish_address: sacrament.parish_address || '',
      logo_img: logoImg,
      person_name: `${sacrament.first_name} ${sacrament.last_name}`,
      sacrament_date: sacrament.date ? new Date(sacrament.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A',
      place: sacrament.place || '',
      celebrant: sacrament.celebrant || '',
      sponsors: sponsors || 'N/A',
      register_volume: sacrament.register_volume || 'N/A',
      register_page: sacrament.register_page || 'N/A',
      qr_code: `<img src="${qrDataUrl}" width="80" height="80" />`,
      verification_url: verifyUrl,
      qr_token: qrToken,
      parents: '',
    });

    // Generate PDF
    const certDir = await ensureCertDir();
    const fileName = `cert_${qrToken}.pdf`;
    const filePath = path.join(certDir, fileName);
    const storagePath = `certificates/${fileName}`;

    let pdfGenerated = false;
    try {
      await generatePDF(html, filePath);
      pdfGenerated = true;
    } catch (pdfErr) {
      console.warn('PDF generation failed, storing HTML:', pdfErr);
      // Save HTML as fallback
      const htmlPath = filePath.replace('.pdf', '.html');
      await fs.writeFile(htmlPath, html, 'utf-8');
    }

    // Save certificate record
    const certRes = await pool.query(
      `INSERT INTO certificates (sacrament_id, template_id, generated_by_user_id, storage_path, hash_or_qr_token)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [sacramentId, templateId || template.id || null, req.user!.userId, storagePath, qrToken]
    );

    await logAudit(req, 'certificate', certRes.rows[0].id, 'GENERATE', undefined, { sacramentId, personId, qrToken });

    res.status(201).json({
      id: certRes.rows[0].id,
      qrToken,
      downloadUrl: `/api/certificates/${certRes.rows[0].id}/download`,
      pdfGenerated,
      verificationUrl: verifyUrl,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /certificate-requests  ← MUST be before /:id to avoid route collision
router.get('/requests', requireRoles(ROLES.ADMIN, ROLES.CLERK), async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT cr.*, st.name as sacrament_name, p.first_name, p.last_name
       FROM certificate_requests cr
       JOIN sacrament_types st ON cr.sacrament_type_id = st.id
       JOIN people p ON cr.person_id = p.id
       ORDER BY cr.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /certificates/:id — metadata + download URL
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT c.*, st.name as sacrament_name, p.first_name, p.last_name
       FROM certificates c
       JOIN sacraments s ON c.sacrament_id = s.id
       JOIN sacrament_types st ON s.sacrament_type_id = st.id
       JOIN people p ON s.person_id = p.id
       WHERE c.id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) { res.status(404).json({ error: 'Certificate not found' }); return; }

    const cert = result.rows[0];
    res.json({ ...cert, downloadUrl: `/api/certificates/${cert.id}/download` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /certificates/:id/download — serve the file
router.get('/:id/download', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT storage_path, hash_or_qr_token FROM certificates WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) { res.status(404).json({ error: 'Certificate not found' }); return; }

    const { storage_path, hash_or_qr_token } = result.rows[0];
    const pdfPath = path.join(process.cwd(), storage_path);
    const htmlPath = pdfPath.replace('.pdf', '.html');

    try {
      await fs.access(pdfPath);
      res.setHeader('Content-Disposition', `attachment; filename="certificate_${hash_or_qr_token}.pdf"`);
      res.setHeader('Content-Type', 'application/pdf');
      const content = await fs.readFile(pdfPath);
      res.send(content);
    } catch {
      // Try HTML fallback
      await fs.access(htmlPath);
      res.setHeader('Content-Disposition', `attachment; filename="certificate_${hash_or_qr_token}.html"`);
      res.setHeader('Content-Type', 'text/html');
      const content = await fs.readFile(htmlPath, 'utf-8');
      res.send(content);
    }
  } catch {
    res.status(404).json({ error: 'Certificate file not found' });
  }
});

// POST /certificate-requests
router.post('/requests', async (req: Request, res: Response): Promise<void> => {
  const schema = z.object({
    sacramentTypeId: z.string().uuid(),
    personId: z.string().uuid(),
    reason: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() }); return; }

  try {
    const result = await pool.query(
      `INSERT INTO certificate_requests (requested_by_person_id, sacrament_type_id, person_id, reason)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [parsed.data.personId, parsed.data.sacramentTypeId, parsed.data.personId, parsed.data.reason]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /certificate-requests/:id
router.patch('/requests/:id', requireRoles(ROLES.ADMIN, ROLES.CLERK), async (req: Request, res: Response): Promise<void> => {
  const schema = z.object({
    status: z.enum(['approved', 'rejected', 'fulfilled']),
    fulfilledCertificateId: z.string().uuid().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() }); return; }

  try {
    const result = await pool.query(
      `UPDATE certificate_requests SET
         status = $1, fulfilled_certificate_id = $2, updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [parsed.data.status, parsed.data.fulfilledCertificateId || null, req.params.id]
    );
    if (!result.rows[0]) { res.status(404).json({ error: 'Request not found' }); return; }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /verify/:token — public endpoint
router.get('/verify/:token', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT c.generated_at, c.hash_or_qr_token,
              s.date, st.name as sacrament_name,
              p.first_name, p.last_name,
              par.name as parish_name
       FROM certificates c
       JOIN sacraments s ON c.sacrament_id = s.id
       JOIN sacrament_types st ON s.sacrament_type_id = st.id
       JOIN people p ON s.person_id = p.id
       JOIN parishes par ON s.parish_id = par.id
       WHERE c.hash_or_qr_token = $1`,
      [req.params.token]
    );
    if (!result.rows[0]) { res.status(404).json({ valid: false, message: 'Certificate not found' }); return; }
    res.json({ valid: true, certificate: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
