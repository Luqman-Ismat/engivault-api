"""
EngiVault CLI - Command line interface for EngiVault calculations
"""
import json
import sys
from typing import Dict, Any, Optional
import click
from rich.console import Console
from rich.table import Table
from rich import print as rprint

from .client import EngiVaultClient
from .exceptions import EngiVaultError

console = Console()


@click.group()
@click.option('--api-key', envvar='ENGIVAULT_API_KEY', help='EngiVault API key')
@click.option('--base-url', envvar='ENGIVAULT_BASE_URL', 
              default='https://engivault-api.railway.app',
              help='EngiVault API base URL')
@click.option('--format', 'output_format', type=click.Choice(['json', 'table']), 
              default='table', help='Output format')
@click.pass_context
def main(ctx: click.Context, api_key: Optional[str], base_url: str, output_format: str):
    """EngiVault CLI - Engineering calculations from the command line"""
    ctx.ensure_object(dict)
    ctx.obj['client'] = EngiVaultClient(api_key=api_key, base_url=base_url)
    ctx.obj['format'] = output_format


@main.command()
@click.pass_context
def health(ctx: click.Context):
    """Check API health status"""
    try:
        client = ctx.obj['client']
        result = client.health()
        
        if ctx.obj['format'] == 'json':
            click.echo(json.dumps(result, indent=2))
        else:
            table = Table(title="EngiVault API Health")
            table.add_column("Property", style="cyan")
            table.add_column("Value", style="green")
            
            table.add_row("Status", result['status'])
            table.add_row("Version", result['version'])
            table.add_row("Uptime", f"{result['uptime']:.2f}s")
            table.add_row("Memory RSS", f"{result['memory']['rss'] / 1024 / 1024:.1f} MB")
            
            console.print(table)
            
    except EngiVaultError as e:
        rprint(f"[red]Error: {e.message}[/red]")
        sys.exit(1)


@main.group()
def fluid():
    """Fluid mechanics calculations"""
    pass


@fluid.command('open-channel')
@click.option('--flow-rate', type=float, required=True, help='Flow rate in m³/s')
@click.option('--width', type=float, required=True, help='Channel width in m')
@click.option('--slope', type=float, required=True, help='Channel slope (dimensionless)')
@click.option('--manning', type=float, required=True, help='Manning\'s roughness coefficient')
@click.option('--shape', type=click.Choice(['rectangular', 'trapezoidal', 'circular']),
              default='rectangular', help='Channel shape')
@click.pass_context
def open_channel_flow(ctx: click.Context, flow_rate: float, width: float, 
                     slope: float, manning: float, shape: str):
    """Calculate open channel flow properties"""
    try:
        client = ctx.obj['client']
        result = client.fluid_mechanics.open_channel_flow(
            flow_rate=flow_rate,
            channel_width=width,
            channel_slope=slope,
            mannings_coeff=manning,
            channel_shape=shape
        )
        
        if ctx.obj['format'] == 'json':
            click.echo(json.dumps(result, indent=2))
        else:
            table = Table(title="Open Channel Flow Results")
            table.add_column("Property", style="cyan")
            table.add_column("Value", style="green")
            table.add_column("Unit", style="yellow")
            
            table.add_row("Normal Depth", f"{result['normal_depth']:.4f}", "m")
            table.add_row("Critical Depth", f"{result['critical_depth']:.4f}", "m")
            table.add_row("Velocity", f"{result['velocity']:.3f}", "m/s")
            table.add_row("Froude Number", f"{result['froude_number']:.3f}", "-")
            table.add_row("Flow Regime", result['flow_regime'], "-")
            table.add_row("Hydraulic Radius", f"{result['hydraulic_radius']:.4f}", "m")
            
            console.print(table)
            
    except EngiVaultError as e:
        rprint(f"[red]Error: {e.message}[/red]")
        sys.exit(1)


@main.group()
def heat():
    """Heat transfer calculations"""
    pass


@heat.command('lmtd')
@click.option('--hot-in', type=float, required=True, help='Hot fluid inlet temperature (K)')
@click.option('--hot-out', type=float, required=True, help='Hot fluid outlet temperature (K)')
@click.option('--cold-in', type=float, required=True, help='Cold fluid inlet temperature (K)')
@click.option('--cold-out', type=float, required=True, help='Cold fluid outlet temperature (K)')
@click.option('--flow', type=click.Choice(['counterflow', 'parallel']),
              default='counterflow', help='Flow arrangement')
@click.pass_context
def lmtd(ctx: click.Context, hot_in: float, hot_out: float, 
         cold_in: float, cold_out: float, flow: str):
    """Calculate Log Mean Temperature Difference"""
    try:
        client = ctx.obj['client']
        result = client.heat_transfer.lmtd(
            t_hot_in=hot_in,
            t_hot_out=hot_out,
            t_cold_in=cold_in,
            t_cold_out=cold_out,
            flow_arrangement=flow
        )
        
        if ctx.obj['format'] == 'json':
            click.echo(json.dumps(result, indent=2))
        else:
            table = Table(title="LMTD Calculation Results")
            table.add_column("Property", style="cyan")
            table.add_column("Value", style="green")
            table.add_column("Unit", style="yellow")
            
            table.add_row("LMTD", f"{result['lmtd']:.2f}", "K")
            
            console.print(table)
            
    except EngiVaultError as e:
        rprint(f"[red]Error: {e.message}[/red]")
        sys.exit(1)


@main.command()
@click.option('--input-file', type=click.File('r'), help='JSON input file')
@click.option('--output-file', type=click.File('w'), help='Output file')
@click.pass_context
def batch(ctx: click.Context, input_file, output_file):
    """Run batch calculations from JSON input file"""
    if not input_file:
        rprint("[red]Error: --input-file is required for batch processing[/red]")
        sys.exit(1)
    
    try:
        data = json.load(input_file)
        client = ctx.obj['client']
        results = []
        
        for calculation in data.get('calculations', []):
            calc_type = calculation.get('type')
            params = calculation.get('parameters', {})
            
            if calc_type == 'open_channel_flow':
                result = client.fluid_mechanics.open_channel_flow(**params)
            elif calc_type == 'lmtd':
                result = client.heat_transfer.lmtd(**params)
            else:
                rprint(f"[yellow]Warning: Unknown calculation type: {calc_type}[/yellow]")
                continue
                
            results.append({
                'type': calc_type,
                'parameters': params,
                'result': result
            })
        
        output_data = {'results': results}
        
        if output_file:
            json.dump(output_data, output_file, indent=2)
            rprint(f"[green]Results written to {output_file.name}[/green]")
        else:
            click.echo(json.dumps(output_data, indent=2))
            
    except EngiVaultError as e:
        rprint(f"[red]Error: {e.message}[/red]")
        sys.exit(1)
    except Exception as e:
        rprint(f"[red]Error: {str(e)}[/red]")
        sys.exit(1)


if __name__ == '__main__':
    main()
