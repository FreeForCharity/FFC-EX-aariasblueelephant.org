# Free For Charity Website

## 🎨 Jekyll Static Website

This repository contains the **Free For Charity** website built with Jekyll, a static site generator that's natively supported by GitHub Pages!

### Quick Links

- 🌐 **[Live Site](https://freeforcharity.github.io/FFC-IN-Single_Page_Template_Jekell/)** - GitHub Pages deployment
- 📖 **[Jekyll Documentation](https://jekyllrb.com/docs/)** - Learn about Jekyll
- 🔄 **[Conversion History](./HTML_CONVERSION_SUMMARY.md)** - Documentation of previous conversions

---

## Organization

**Free For Charity** is a 501(c)(3) nonprofit organization (EIN: 46-2471893) dedicated to supporting other nonprofits.

**Mission**: Free For Charity connects students, professionals, and businesses with nonprofits to reduce operating costs and increase impact. By providing free web hosting, domain names, Microsoft 365 grants assistance, and consulting services, we help nonprofits put more resources back into their charitable missions.

**Primary Contact**: Clarke Moyer ([@clarkemoyer](https://github.com/clarkemoyer)) - clarkemoyer@freeforcharity.org

---

## Repository Structure

```
_layouts/                        # Jekyll page templates
├── default.html                # Main layout with header/footer
└── page.html                   # Simple page layout for policy pages

_includes/                       # Reusable components
├── header.html                 # Site header/navigation
├── footer.html                 # Site footer
└── cookie-consent.html         # Cookie consent banner

assets/                          # Static files
├── css/                        # Stylesheets
│   └── styles.css             # All site styles
├── js/                         # JavaScript files
│   └── main.js                # Site functionality
├── images/                     # Image assets (WebP optimized)
├── svgs/                       # SVG icons
└── videos/                     # Video files

index.html                       # Homepage (uses default layout)
privacy-policy.md               # Privacy policy page
cookie-policy.md                # Cookie policy page
terms-of-service.md             # Terms of service page
donation-policy.md              # Donation policy page
free-for-charity-donation-policy.md
vulnerability-disclosure-policy.md
security-acknowledgements.md

_config.yml                      # Jekyll configuration
Gemfile                         # Ruby dependencies
Gemfile.lock                    # Locked gem versions

_site/                          # Generated site (not committed)
html-site/                      # Legacy HTML version (archived)
tests/                          # Playwright E2E tests
docs-backup/                    # Archived documentation
```

---

## Local Development

### Prerequisites

- Ruby 3.2 or higher
- Bundler gem (`gem install bundler`)

### Setup and Run

1. **Install dependencies:**
   ```bash
   bundle install
   ```

2. **Build the site:**
   ```bash
   bundle exec jekyll build
   ```

3. **Serve the site locally:**
   ```bash
   bundle exec jekyll serve
   ```
   Then visit http://localhost:4000

4. **Serve with live reload:**
   ```bash
   bundle exec jekyll serve --livereload
   ```

### Making Changes

- **Update homepage:** Edit `index.html`
- **Update header/footer:** Edit files in `_includes/`
- **Update page layout:** Edit files in `_layouts/`
- **Update styles:** Edit `assets/css/styles.css`
- **Update JavaScript:** Edit `assets/js/main.js`
- **Update site config:** Edit `_config.yml`
- **Add new page:** Create a new `.md` or `.html` file with frontmatter

---

## Website Features

### Homepage Sections
- **Hero Section** - Welcome message with call-to-action buttons
- **Mission Section** - Mission statement with video
- **Results 2023** - Impact numbers with animated counters
- **Volunteer Section** - Call to action for volunteers
- **Events Section** - Facebook Events integration
- **Donate Section** - Zeffy donation form
- **Programs Section** - Free hosting, domains, consulting
- **FAQ Section** - Accordion-style questions
- **Team Section** - Team member cards

### Navigation & Layout
- **Sticky Header** - Navigation with mobile hamburger menu
- **Mobile Menu** - Slide-out panel with overlay
- **Footer** - Links, social media, contact info
- **Smooth Scrolling** - To section anchors
- **Active Nav Highlighting** - Based on scroll position

### Policy Pages
All legal and policy information is available on separate pages:
- Privacy Policy
- Cookie Policy
- Terms of Service
- Donation Policy
- Free For Charity Donation Policy
- Vulnerability Disclosure Policy
- Security Acknowledgements

---

## Deployment

The site is automatically built with Jekyll and deployed to GitHub Pages when changes are pushed to the `main` branch.

- **Production URL**: https://freeforcharity.github.io/FFC-IN-Single_Page_Template_Jekell/
- **Deployment**: Via GitHub Actions (`.github/workflows/deploy.yml`)
- **Build Tool**: Jekyll (GitHub Pages native)
- **Repository Path**: Configured via `baseurl` in `_config.yml`

### Deployment Process

1. Push changes to `main` branch
2. GitHub Actions workflow triggers
3. Runs tests and security checks
4. Builds Jekyll site (`bundle exec jekyll build`)
5. Deploys `_site/` directory to GitHub Pages
6. Site is live at https://freeforcharity.github.io/FFC-IN-Single_Page_Template_Jekell/

### Jekyll Features

- **Templating**: DRY (Don't Repeat Yourself) code with layouts and includes
- **SEO Tags**: Automatic meta tags for better search engine optimization
- **Sitemap**: Auto-generated sitemap.xml
- **Feed**: Auto-generated RSS feed
- **Liquid**: Dynamic content generation
- **Markdown Support**: Write content in markdown

---

## Testing

The repository includes Playwright end-to-end tests:

```bash
# Run tests (after building the site)
npm test

# Run tests in headed mode
npm run test:headed

# Run tests with UI
npm run test:ui
```

---

## Jekyll Advantages

This site uses Jekyll instead of plain HTML for several benefits:

1. **DRY Code**: Header, footer, and other components defined once and reused
2. **Maintainability**: Update navigation links in one file instead of 8+ files
3. **SEO**: Automatic sitemap, meta tags, and structured data
4. **GitHub Pages Native**: No external build process needed
5. **Content Management**: Add new pages easily with frontmatter
6. **Version Control**: Separate content (markdown) from presentation (layouts)

---

## Migration Notes

This site was previously a pure HTML static site. The Jekyll conversion maintains all functionality while adding:
- Reusable templates
- Better SEO
- Easier content updates
- Automatic sitemap and feed generation

The legacy HTML version is preserved in the `html-site/` directory for reference.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project.

---

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

---

## Contact

For questions or support, please contact:
- **Email**: clarkemoyer@freeforcharity.org
- **Website**: https://freeforcharity.github.io/FFC-IN-Single_Page_Template_Jekell/

---

## CNCF-Compliant Open Source Project

This repository follows **Cloud Native Computing Foundation (CNCF)** standards for governance, security, and community practices. We are committed to transparency, inclusive participation, and professional project management.

### Project Governance and Policies

- 📜 **[LICENSE](./LICENSE)** - Apache 2.0 open source license
- �� **[CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)** - Community standards (Contributor Covenant 2.1)
- ⚖️ **[GOVERNANCE.md](./GOVERNANCE.md)** - Decision-making processes
- 👥 **[MAINTAINERS.md](./MAINTAINERS.md)** - Repository maintainers and their roles
- �� **[CONTRIBUTORS.md](./CONTRIBUTORS.md)** - Recognition of all contributors
- 🔒 **[SECURITY.md](./SECURITY.md)** - Vulnerability reporting and security practices
- 🛡️ **[THREAT-MODEL.md](./THREAT-MODEL.md)** - Security threat analysis
- 🌟 **[ADOPTERS.md](./ADOPTERS.md)** - Organizations using this template
- 🤝 **[CONTRIBUTING.md](./CONTRIBUTING.md)** - How to contribute
- 💬 **[SUPPORT.md](./SUPPORT.md)** - How to get help
- 🔗 **[EXTERNAL_DEPENDENCIES.md](./EXTERNAL_DEPENDENCIES.md)** - Third-party services
- 📖 **[CITATION.cff](./CITATION.cff)** - Citation information for academic use
- 📝 **[CHANGELOG.md](./CHANGELOG.md)** - Release notes and version history

**Why CNCF Alignment?** Following CNCF standards strengthens project credibility, simplifies onboarding of contributors, and prepares us for cloud-native ecosystem integrations.

---

## Historical Context

This repository has evolved through several technology stacks:
1. **React/Next.js Application** → **Pure HTML/CSS/JavaScript** → **Jekyll Static Site**

The Jekyll conversion maintains all functionality while adding benefits of a static site generator. For details on previous conversions:
- [HTML Conversion Summary](./HTML_CONVERSION_SUMMARY.md)
- [HTML Conversion Assessment](./HTML_CONVERSION_ASSESSMENT.md)
- [HTML Conversion Verification](./HTML_CONVERSION_VERIFICATION.md)
