# 🤝 Contributing to ZPool

Thank you for your interest in contributing to ZPool! This document provides guidelines and information for contributors.

## 🌟 Getting Started

### Prerequisites
- Node.js 18+
- Git
- MetaMask wallet
- Basic knowledge of:
  - Solidity (for smart contracts)
  - React/TypeScript (for frontend)
  - FHE concepts (helpful but not required)

### Development Setup
```bash
# Clone the repository
git clone https://github.com/your-username/zpool.git
cd zpool

# Install dependencies
cd fhevm-hardhat && npm install
cd ../zpool-fe && npm install

# Set up environment
cp fhevm-hardhat/deploy-config.example fhevm-hardhat/deploy-config.json
# Edit deploy-config.json with your settings
```

## 📋 Contribution Guidelines

### Code Style
- **TypeScript**: Use strict type checking
- **Solidity**: Follow OpenZeppelin standards
- **React**: Use functional components with hooks
- **CSS**: Component-based styling
- **Comments**: Clear, descriptive comments

### Commit Messages
Use conventional commit format:
```
type(scope): description

feat(frontend): add new token selector component
fix(contracts): resolve gas optimization issue
docs(readme): update installation instructions
test(fhe): add encryption/decryption tests
```

### Pull Request Process
1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Make** your changes
4. **Test** thoroughly
5ommit** with clear messages
6. **Push** to your fork
7. **Create** a pull request

## 🏗️ Project Structure

### Smart Contracts (`fhevm-hardhat/`)
```
contracts/
├── ZPool.sol          # Main pool contract
├── TestToken.sol      # Test ERC20 tokens
└── interfaces/        # Contract interfaces

scripts/
├── deploy/           # Deployment scripts
├── tasks/            # Hardhat tasks
└── utils/            # Utility functions

test/
├── ZPoolTest.ts      # Main contract tests
└── integration/      # Integration tests
```

### Frontend (`zpool-fe/`)
```
src/
├── components/       # React components
├── hooks/           # Custom React hooks
├── services/        # External services
├── styles/          # CSS files
├── config/          # Configuration
├── contexts/        # React contexts
└── utils/           # Utility functions
```

## 🧪 Testing

### Smart Contract Testing
```bash
cd fhevm-hardhat

# Run all tests
npm test

# Run specific test
npm test test/ZPoolTest.ts

# Test with coverage
npm run coverage
```

### Frontend Testing
```bash
cd zpool-fe

# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Test build
npm run build
```

### FHE Testing
```bash
# Test FHE functionality
npm run test:fhe

# Test encryption/decryption
npm run test:encryption
```

## 🔧 Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
# Test changes
# Commit changes
git add .
git commit -m "feat: add new feature# Push to fork
git push origin feature/new-feature
```

### 2. Bug Fixes
```bash
# Create bug fix branch
git checkout -b fix/bug-description

# Fix the bug
# Add tests
# Commit fix
git commit -mfix: resolve bug description"

# Push fix
git push origin fix/bug-description
```

### 3. Documentation Updates
```bash
# Create docs branch
git checkout -b docs/update-readme

# Update documentation
# Commit changes
git commit -m docs: update README with new information

#Push docs
git push origin docs/update-readme
```

## 🎯 Areas for Contribution

### High Priority
-mance Optimization**: Improve gas usage and FHE operations
- [ ] **Security Enhancements**: Additional security audits and improvements
- [ ] **Error Handling**: Better error messages and recovery mechanisms
- [ ] **Testing**: More comprehensive test coverage

### Medium Priority
- [ ] **UI/UX Improvements**: Better user experience and accessibility
- [ ] **Documentation**: More examples and tutorials
- [ ] **Mobile Support**: Enhanced mobile responsiveness
- [ ] **Internationalization**: Multi-language support

### Low Priority
- [ ] **Advanced Features**: Batch operations, advanced privacy features
- Analytics**: Usage tracking and performance monitoring
-] **Integration**: Third-party service integrations
- [ ] **Deployment**: CI/CD pipeline improvements

## 🔐 Security

### Reporting Security Issues
- **DO NOT** create public issues for security vulnerabilities
- **Email** security issues to: security@zpool.com
- **Include** detailed description and reproduction steps
- **Expect** response within 48 hours

### Security Guidelines
- **Never** commit private keys or sensitive data
- **Always** validate user inputs
- **Use** secure random number generation
- **Follow** security best practices for FHE

## 📚 Learning Resources

### FHE Resources
- [Zama Documentation](https://docs.zama.ai/)
- [FHEVM Guide](https://docs.zama.ai/fhevm)
- [FHE Concepts](https://docs.zama.ai/concepts)

### Development Resources
- [Solidity Docs](https://docs.soliditylang.org/)
- [React Docs](https://reactjs.org/docs/)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Hardhat Docs](https://hardhat.org/docs/)

### Community
- [Zama Discord](https://discord.gg/zama)
- [GitHub Discussions](https://github.com/your-repo/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/fhe)

## 🏆 Recognition

### Contributors
- **Code Contributors**: Listed in GitHub contributors
- **Documentation**: Credit in README
- **Bug Reports**: Recognition in changelog
- **Security**: Special acknowledgment

### Contribution Levels
- **Bronze**: 1-5contributions
- **Silver**: 6-20contributions
- **Gold**: 21contributions
- **Platinum**: Major feature contributions

## 📞 Getting Help

### Before Asking
1. **Check** existing documentation
2. **Search** existing issues
3. **Try** troubleshooting guide
4. **Test** in development environment

### Asking Questions
- **Be specific** about your issue
- **Include** error messages and logs
- **Provide** reproduction steps
- **Show** what you've tried

### Communication Channels
- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and ideas
- **Discord**: For real-time help
- **Email**: For security issues

## 📋 Code of Conduct

### Our Standards
- **Be respectful** and inclusive
- **Be collaborative** and helpful
- **Be constructive** in feedback
- **Be professional** in communication

### Enforcement
- **Warnings** for minor violations
- **Temporary bans** for repeated violations
- **Permanent bans** for serious violations
- **Appeal process** available

## 🎉 Thank You

Thank you for contributing to ZPool! Your contributions help make privacy-preserving DeFi accessible to everyone.

### Quick Links
- [README](../README.md) - Project overview
- [Smart Contracts](../fhevm-hardhat/README.md) - Contract development
- [Frontend](../zpool-fe/README.md) - UI development
- [FHE Integration](../zpool-fe/FHE_INTEGRATION.md) - FHE setup
- [Troubleshooting](../zpool-fe/TROUBLESHOOTING.md) - Common issues

---

**Happy coding! 🚀** 