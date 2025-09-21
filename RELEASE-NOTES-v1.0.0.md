# ENGiVAULT v1.0.0 - Beta Release

## 🎉 Welcome to ENGiVAULT - Professional Engineering Calculations Platform

This is the first beta release of ENGiVAULT, a comprehensive engineering calculations platform with cross-platform support for Python, JavaScript, and Excel integration.

## 📦 Download the Installer

### **macOS**
- **Intel Macs**: [ENGiVAULT Installer-1.0.0.dmg](../../releases/download/v1.0.0/ENGiVAULT%20Installer-1.0.0.dmg) (95 MB)
- **Apple Silicon Macs**: [ENGiVAULT Installer-1.0.0-arm64.dmg](../../releases/download/v1.0.0/ENGiVAULT%20Installer-1.0.0-arm64.dmg) (92 MB)

### **Windows**
- **Setup Installer**: [ENGiVAULT Installer Setup 1.0.0.exe](../../releases/download/v1.0.0/ENGiVAULT%20Installer%20Setup%201.0.0.exe) (140 MB)
- **Portable Version**: [ENGiVAULT Installer 1.0.0.exe](../../releases/download/v1.0.0/ENGiVAULT%20Installer%201.0.0.exe) (140 MB)

### **Linux**
- **Universal AppImage**: [ENGiVAULT Installer-1.0.0.AppImage](../../releases/download/v1.0.0/ENGiVAULT%20Installer-1.0.0.AppImage) (100 MB)

## 🚀 What's Included

### **Core Platform**
- **TypeScript API**: High-performance REST API with comprehensive engineering calculations
- **Python SDK**: Complete Python library with CLI tools (`pip install engivault`)
- **JavaScript SDK**: NPM package with full TypeScript support (`npm install engivault`)
- **Excel Integration**: VBA modules for seamless Excel/LibreOffice integration
- **Cross-Platform Launcher**: Beautiful installer for all platforms

### **Engineering Calculations**
- **Fluid Mechanics**: Open channel flow, compressible flow, boundary layer analysis, external flow
- **Heat Transfer**: Heat exchangers, LMTD, convection, fin analysis, thermal resistance networks
- **Hydraulics**: Pressure drop, flow rate calculations
- **Pumps**: Performance analysis, NPSH calculations

### **Professional Features**
- **SaaS Authentication**: User registration, API keys, subscription tiers
- **Usage Analytics**: Comprehensive tracking and performance monitoring
- **Type Safety**: Full TypeScript support with IntelliSense
- **Error Handling**: Graceful error recovery and user feedback
- **Documentation**: Complete API reference and usage guides

## 🧪 Beta Testing Program

### **Who Should Test**
- **Mechanical Engineers**: Heat transfer and fluid mechanics calculations
- **Chemical Engineers**: Process design and heat exchanger sizing
- **Civil Engineers**: Hydraulics and open channel flow
- **Software Developers**: API integration and SDK usage
- **Engineering Professors**: Calculation validation and educational use

### **What to Test**
1. **Installation Process**: Does the launcher work on your platform?
2. **Calculation Accuracy**: Do results match your manual calculations?
3. **API Usability**: Is the interface intuitive and well-documented?
4. **Integration Quality**: How well do the SDKs work in your workflow?
5. **Performance**: Are response times acceptable for your use cases?

### **How to Report Issues**
- **GitHub Issues**: [Report bugs and feature requests](https://github.com/Luqman-Ismat/engivault-api/issues)
- **Email**: beta@engivault.com
- **Documentation**: See [BETA-TESTING.md](./BETA-TESTING.md) for detailed guide

## 🔧 Installation Instructions

### **Using the Launcher (Recommended)**
1. Download the installer for your platform
2. Run the installer (may show security warnings - this is normal for unsigned beta software)
3. Follow the guided installation process
4. Choose which components to install (Python, NPM, Excel)
5. Start using ENGiVAULT!

### **Manual Installation**
```bash
# Python SDK
pip install engivault[dev,docs,cli]

# JavaScript SDK  
npm install engivault

# Excel Integration
# Import VBA modules from excel-integration/vba-modules/
```

## 🎯 System Requirements

### **Minimum Requirements**
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **Memory**: 4 GB RAM
- **Storage**: 500 MB free space
- **Network**: Internet connection for package downloads

### **For Python SDK**
- **Python**: 3.8 or higher
- **pip**: Latest version recommended

### **For JavaScript SDK**
- **Node.js**: 14.0 or higher
- **npm/yarn/pnpm**: Latest version recommended

### **For Excel Integration**
- **Windows**: Microsoft Excel 2013 or higher
- **macOS**: Microsoft Excel for Mac
- **Linux**: LibreOffice Calc 6.0 or higher

## 🛡️ Security Notice

### **Code Signing Status**
- **macOS**: Unsigned (Gatekeeper will show warnings)
- **Windows**: Unsigned (Windows Defender may show warnings)
- **Linux**: No signing required

### **Beta Security**
- This is beta software for testing purposes
- Use in non-production environments only
- Production releases will include proper code signing

### **Running Unsigned Software**
- **macOS**: Right-click → Open, then click "Open" in the dialog
- **Windows**: Click "More info" → "Run anyway" if Windows Defender warns
- **Linux**: Make executable: `chmod +x ENGiVAULT*.AppImage`

## 📊 What's New in v1.0.0

### **🎨 Professional Design**
- ENGiVAULT design system with Montserrat typography
- Clean black/white interface optimized for engineering workflows
- Dark/light theme support with system preference detection
- Responsive design for different screen sizes

### **🔧 Technical Excellence**
- High-performance Fastify API framework
- Type-safe development with TypeScript and Zod validation
- Comprehensive error handling and logging
- Cross-platform compatibility verified

### **📦 Easy Installation**
- One-click cross-platform launcher
- Automatic system requirements checking
- Component selection (install only what you need)
- Real-time progress tracking and status updates

### **🧪 Developer Experience**
- Complete TypeScript definitions with IntelliSense
- Tree-shakeable imports for optimal bundle sizes
- Comprehensive examples and documentation
- CLI tools for command-line usage

## 🗺️ Roadmap

### **Next Releases (Q1 2025)**
- **NPM/PyPI Publication**: `npm install engivault` and `pip install engivault`
- **Code Signing**: Proper certificates for security compliance
- **VS Code Extension**: IDE integration with syntax highlighting
- **Additional Calculations**: More engineering modules and functions

### **Future Features**
- **Mobile Apps**: iOS and Android applications
- **CAD Integration**: AutoCAD, SolidWorks, Fusion 360 plugins
- **Enterprise Features**: SSO, on-premises deployment, audit logging
- **Additional Languages**: R, MATLAB, Julia, Go, Rust bindings

## 🤝 Contributing

We welcome contributions from the engineering community:

1. **Beta Testing**: Use ENGiVAULT in your projects and report feedback
2. **Bug Reports**: Help us identify and fix issues
3. **Feature Requests**: Suggest new calculations and integrations
4. **Documentation**: Improve guides and examples
5. **Code Contributions**: Submit pull requests for enhancements

## 📞 Support

- **Documentation**: [docs.engivault.com](https://docs.engivault.com)
- **API Reference**: [API Documentation](https://engivault-api.railway.app/documentation)
- **Community**: [GitHub Discussions](https://github.com/Luqman-Ismat/engivault-api/discussions)
- **Issues**: [Bug Reports](https://github.com/Luqman-Ismat/engivault-api/issues)
- **Email**: support@engivault.com

## 📄 License

ENGiVAULT is released under the MIT License. See [LICENSE](./LICENSE) for details.

## 🙏 Acknowledgments

Special thanks to all beta testers and contributors who helped make ENGiVAULT possible.

---

**ENGiVAULT v1.0.0** - Making engineering calculations accessible to everyone! 🚀

*Created by Luqman Ismat - Engineering Software Developer*
