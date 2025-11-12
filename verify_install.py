"""
Script de verificación del sistema
Ejecuta este script para verificar que todo esté correctamente instalado
"""

import sys
import subprocess
import platform

def print_header(text):
    print("\n" + "="*60)
    print(f"  {text}")
    print("="*60)

def check_python():
    print_header("Verificando Python")
    version = sys.version_info
    print(f"✓ Python {version.major}.{version.minor}.{version.micro} detectado")
    
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("⚠ ADVERTENCIA: Se recomienda Python 3.8 o superior")
        return False
    print("✓ Versión de Python adecuada")
    return True

def check_module(module_name, package_name=None):
    package_name = package_name or module_name
    try:
        __import__(module_name)
        print(f"✓ {package_name} instalado")
        return True
    except ImportError:
        print(f"✗ {package_name} NO instalado")
        print(f"  Instalar con: pip install {package_name}")
        return False

def check_python_packages():
    print_header("Verificando Paquetes Python")
    
    packages = [
        ('aiohttp', 'aiohttp'),
        ('asyncio', None)  # Built-in
    ]
    
    all_ok = True
    for module, package in packages:
        if not check_module(module, package):
            all_ok = False
    
    return all_ok

def check_node():
    print_header("Verificando Node.js")
    try:
        result = subprocess.run(['node', '--version'], 
                              capture_output=True, text=True)
        version = result.stdout.strip()
        print(f"✓ Node.js {version} detectado")
        
        result = subprocess.run(['npm', '--version'], 
                              capture_output=True, text=True)
        npm_version = result.stdout.strip()
        print(f"✓ npm {npm_version} detectado")
        return True
    except FileNotFoundError:
        print("✗ Node.js NO detectado")
        print("  Descargar desde: https://nodejs.org/")
        return False

def check_frontend_packages():
    print_header("Verificando Paquetes Frontend")
    import os
    
    node_modules = "comunicacionagentes/node_modules"
    package_json = "comunicacionagentes/package.json"
    
    if os.path.exists(package_json):
        print(f"✓ package.json encontrado")
    else:
        print(f"✗ package.json NO encontrado")
        return False
    
    if os.path.exists(node_modules):
        print(f"✓ node_modules instalado")
        return True
    else:
        print(f"⚠ node_modules NO instalado")
        print("  Ejecutar: cd comunicacionagentes && npm install")
        return False

def check_files():
    print_header("Verificando Archivos del Sistema")
    import os
    
    required_files = [
        ('backend_api.py', 'Backend API'),
        ('comunicacionagentes/src/App.jsx', 'Componente principal'),
        ('comunicacionagentes/src/services/agentService.js', 'Servicio de agentes'),
        ('comunicacionagentes/src/services/eventService.js', 'Servicio de eventos'),
        ('comunicacionagentes/src/components/OrganizerDashboard.jsx', 'Dashboard'),
        ('comunicacionagentes/src/components/StudentPortal.jsx', 'Portal'),
    ]
    
    all_ok = True
    for file_path, description in required_files:
        if os.path.exists(file_path):
            print(f"✓ {description}")
        else:
            print(f"✗ {description} NO encontrado: {file_path}")
            all_ok = False
    
    return all_ok

def test_backend():
    print_header("Probando Backend")
    try:
        # Intentar importar backend_api
        import backend_api
        print("✓ backend_api.py puede ser importado")
        
        # Verificar clases principales
        if hasattr(backend_api, 'PlannerAgent'):
            print("✓ PlannerAgent encontrado")
        if hasattr(backend_api, 'WebSocketServer'):
            print("✓ WebSocketServer encontrado")
        
        return True
    except Exception as e:
        print(f"✗ Error al importar backend: {e}")
        return False

def print_summary(results):
    print_header("RESUMEN")
    
    all_passed = all(results.values())
    
    for check, passed in results.items():
        status = "✓" if passed else "✗"
        print(f"{status} {check}")
    
    print("\n" + "="*60)
    if all_passed:
        print("  ✓ SISTEMA LISTO PARA USAR")
        print("="*60)
        print("\nPróximos pasos:")
        print("1. Ejecutar: python backend_api.py")
        print("2. En otra terminal: cd comunicacionagentes && npm run dev")
        print("3. Abrir navegador en: http://localhost:5173")
    else:
        print("  ⚠ SISTEMA REQUIERE CONFIGURACIÓN")
        print("="*60)
        print("\nAcciones requeridas:")
        for check, passed in results.items():
            if not passed:
                print(f"- Resolver: {check}")
    print()

def main():
    print("""
╔══════════════════════════════════════════════════════════╗
║   SISTEMA MULTI-AGENTE - GESTIÓN DE EVENTOS             ║
║   Verificador de Instalación                            ║
╚══════════════════════════════════════════════════════════╝
    """)
    
    print(f"Sistema Operativo: {platform.system()} {platform.release()}")
    print(f"Arquitectura: {platform.machine()}")
    
    results = {}
    
    # Ejecutar verificaciones
    results['Python'] = check_python()
    results['Paquetes Python'] = check_python_packages()
    results['Node.js'] = check_node()
    results['Paquetes Frontend'] = check_frontend_packages()
    results['Archivos del Sistema'] = check_files()
    results['Backend'] = test_backend()
    
    # Mostrar resumen
    print_summary(results)
    
    # Mostrar información adicional
    print("\n" + "="*60)
    print("  INFORMACIÓN ADICIONAL")
    print("="*60)
    print("\nDocumentación:")
    print("- README.md           - Documentación completa")
    print("- QUICK_START.md      - Guía de inicio rápido")
    print("- PROTOCOLOS.md       - Documentación técnica")
    print("\nScripts útiles:")
    print("- install.bat         - Instalar dependencias")
    print("- start.bat           - Iniciar sistema completo")
    print("- verify_install.py   - Este script")
    print("\nSoporte:")
    print("- Revisar logs en terminales")
    print("- Verificar puertos 5173 y 8080 disponibles")
    print("- Consultar README.md para troubleshooting")
    print()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nVerificación interrumpida por usuario")
    except Exception as e:
        print(f"\n\nError durante verificación: {e}")
        import traceback
        traceback.print_exc()
