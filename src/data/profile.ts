// Public profile sources:
// https://github.com/cerrarlosojos/cerrarlosojos.github.io
// _config.yml, _pages/about.md, _pages/cv.md, _publications, and _posts
// Source revision: 058ac6b3325bb0009911e840f44586d021b0ca2d

export const profile = {
  name: "Houjin Chen",
  chineseName: "陈厚锦",
  username: "cerrarlosojos",
  role: "Ph.D. student",
  institution: "Peking University",
  department: "School of Computer Science",
  email: "chenhoujin@stu.pku.edu.cn",
  lab: {
    name: "Programming Languages Lab (PLL)",
    url: "https://pl.cs.pku.edu.cn/",
  },
  advisor: {
    name: "Di Wang",
    url: "https://stonebuddha.github.io/",
  },
  research: {
    field: "Programming Languages",
    focus: "Program Verification",
  },
};

export const education = [
  {
    title: "Ph.D. student in Computer Science",
    desc: "Peking University | School of Computer Science | Programming Languages Lab (PLL) | 2025–Present",
  },
  {
    title: "Bachelor's Degree in Computer Science",
    desc: "Peking University | School of Electronics Engineering and Computer Science | 2021–2025",
  },
];

export const publications = [
  {
    filename: "cstar.pdf",
    title: "C★: Unifying Programming and Verification in C",
    desc: "Co-authored preprint (2025-04-03). A proof-integrated language for C that unifies programming and verification using symbolic execution and an LCF-style proof kernel.",
    pdf: "https://arxiv.org/pdf/2504.02246",
    bibtex: "https://arxiv.org/bibtex/2504.02246",
  },
];

export const socials = [
  {
    title: "GitHub",
    url: "https://github.com/cerrarlosojos",
    label: "https://github.com/cerrarlosojos",
  },
  {
    title: "Email",
    url: `mailto:${profile.email}`,
    label: profile.email,
  },
];
