from mcp.server.fastmcp import FastMCP
import urllib.request
import urllib.error

# Create an MCP server
mcp = FastMCP("Weather India", json_response=True)

@mcp.tool()
def get_weather(city: str) -> str:
    """Get weather for a specific city"""
    try:
        # wttr.in returns simple text with ?format=3
        url = f"https://wttr.in/{city}?format=3"
        with urllib.request.urlopen(url) as response:
            return response.read().decode('utf-8').strip()
    except urllib.error.URLError as e:
        return f"Error fetching weather for {city}: {e}"

# Add a weather resource
@mcp.resource("weather://{city}")
def get_weather_resource(city: str) -> str:
    """Get weather for a city as a resource"""
    return get_weather(city)

# Add a prompt
@mcp.prompt()
def weather_summary(city: str) -> str:
    """Generate a prompt to summarize weather"""
    return f"Please provide a detailed weather summary for {city} based on the current conditions."

if __name__ == "__main__":
    mcp.run(transport="streamable-http")
