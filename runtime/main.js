/*
 * LaTeX Toolbox v4.5 — Interactive STEM Companion, Wolfram Guide, Smart Matrix/Chem & EE Workbench
 * PART 1 OF 2: Taxonomy, Wolfram Guide & Natural Parser, Smart Matrix & Case-Insensitive Chem Engine,
 *              Live Cursor Highlighter, Floating Step-by-Step Solver, and In-Note Slot Pop-up.
 */

"use strict";
var obsidian = require("obsidian");

// ============================================================================
// 1. DIRECTORY TREE TAXONOMY & WOLFRAM / MATLAB GUIDE EXAMPLES
// ============================================================================
var TAXONOMY = {
  math: {
    label: "Mathematics",
    icon: "∑",
    topics: {
      algebra: {
        label: "Algebra & Functions",
        subtopics: ["Quadratics & Polynomials", "Logarithms & Exponentials", "Sequences & Series", "Complex Numbers", "Binomial Theorem"]
      },
      trigonometry: {
        label: "Trigonometry",
        subtopics: ["Basic Ratios", "Pythagorean & Angle Identities", "Double & Half Angle", "Sum-to-Product", "Inverse Trig", "Law of Sines & Cosines"]
      },
      calculus: {
        label: "Calculus",
        subtopics: ["Limits & Continuity", "Derivatives", "Partial Derivatives", "Indefinite Integrals", "Definite & Multiple Integrals", "Taylor & Maclaurin Series"]
      },
      linear_algebra: {
        label: "Vectors & Matrices",
        subtopics: ["Vectors & Dot/Cross Product", "Matrices & Determinants", "Eigenvalues & Eigenvectors", "Linear Systems"]
      },
      diff_eq: {
        label: "Differential Equations & Transforms",
        subtopics: ["1st Order ODE", "2nd Order ODE", "Laplace Transforms", "Fourier Series & Transforms", "Vector Calculus (Grad/Div/Curl)"]
      },
      probability: {
        label: "Probability & Statistics",
        subtopics: ["Combinatorics", "Distributions", "Expectation & Variance", "Bayes & Regression"]
      }
    }
  },
  physics: {
    label: "Physics",
    icon: "Φ",
    topics: {
      mechanics: {
        label: "Mechanics & Gravitation",
        subtopics: ["Kinematics", "Newton's Laws & Friction", "Work, Energy & Power", "Rotational Motion", "Gravitation", "Simple Harmonic Motion", "Fluid Mechanics"]
      },
      thermodynamics: {
        label: "Heat & Thermodynamics",
        subtopics: ["Kinetic Theory & Ideal Gas", "Laws of Thermodynamics", "Entropy & Heat Engines", "Heat Transfer"]
      },
      waves_optics: {
        label: "Waves & Optics",
        subtopics: ["Wave Motion & Sound", "Doppler Effect", "Geometrical Optics (Lenses/Mirrors)", "Wave Optics (Interference/Diffraction)"]
      },
      electromagnetism: {
        label: "Electricity & Magnetism",
        subtopics: ["Electrostatics & Gauss's Law", "Capacitance", "Current & DC Circuits", "Magnetic Fields & Forces", "Electromagnetic Induction", "Maxwell's Equations"]
      },
      modern_physics: {
        label: "Modern & Quantum Physics",
        subtopics: ["Photoelectric & Photons", "Atomic Structure & Bohr Model", "Quantum Mechanics", "Nuclear Physics", "Special Relativity"]
      }
    }
  },
  chemistry: {
    label: "Chemistry",
    icon: "⇌",
    topics: {
      reactions: {
        label: "Chemical Equations & Reactions",
        subtopics: ["Synthesis & Decomposition", "Combustion", "Acid-Base Neutralization", "Redox Half-Reactions", "Precipitation & Equilibrium"]
      },
      physical_chem: {
        label: "Stoichiometry & States of Matter",
        subtopics: ["Mole Concept & Concentration", "Ideal & Real Gases", "Colligative Properties", "Atomic Structure"]
      },
      thermochem: {
        label: "Thermochemistry & Kinetics",
        subtopics: ["Enthalpy, Entropy & Gibbs Energy", "Reaction Rates & Rate Laws", "Arrhenius & Activation Energy"]
      },
      equilibrium_acids: {
        label: "Equilibrium, Acids & Bases",
        subtopics: ["Equilibrium Constants (Kp, Kc)", "pH, pOH & Ka/Kb", "Buffers & Henderson-Hasselbalch", "Solubility Product (Ksp)"]
      },
      electrochem: {
        label: "Electrochemistry",
        subtopics: ["Cell Potential & Nernst Equation", "Faraday's Laws", "Conductance"]
      },
      organic: {
        label: "Organic Chemistry",
        subtopics: ["Hydrocarbons & Functional Groups", "Substitution & Elimination", "Oxidation & Reduction", "Named Reactions"]
      }
    }
  },
  electronics: {
    label: "Electrical Eng",
    icon: "⚡",
    topics: {
      dc_ac_circuits: {
        label: "Basic DC & AC Circuits",
        subtopics: ["Ohm's & Kirchhoff's Laws", "Series/Parallel & Dividers", "RC, RL & RLC Transients", "Phasors & Impedance", "AC Power (Real/Reactive/Apparent)", "Resonance & Filters", "Three-Phase Circuits"]
      },
      network_theorems: {
        label: "Network Theorems & Two-Port",
        subtopics: ["Nodal & Mesh Analysis", "Thevenin & Norton", "Superposition & Max Power", "Two-Port Parameters (Z, Y, ABCD, h)"]
      },
      analog_electronics: {
        label: "Analog & Semiconductors",
        subtopics: ["Diodes & Rectifiers", "BJT Biasing & Small-Signal", "MOSFET Operation & Amplifiers", "Operational Amplifiers (Op-Amps)", "Oscillators & Feedback"]
      },
      signals_systems: {
        label: "Signals & Systems",
        subtopics: ["Convolution & LTI Systems", "Fourier & Laplace Analysis", "Z-Transform & Sampling", "DFT & Digital Filters"]
      },
      control_systems: {
        label: "Control Systems",
        subtopics: ["Transfer Functions & Block Diagrams", "Time Response (1st & 2nd Order)", "Routh-Hurwitz & Steady-State Error", "Root Locus, Bode & Nyquist", "State-Space Representation", "PID Controllers"]
      },
      electromagnetics_rf: {
        label: "Electromagnetics & Transmission Lines",
        subtopics: ["Electrostatics & Magnetostatics", "Wave Propagation & Skin Depth", "Transmission Lines & VSWR", "Waveguides & Antennas"]
      },
      power_machines: {
        label: "Power Systems & Electrical Machines",
        subtopics: ["Transformers", "Induction Motors", "Synchronous Generators & Motors", "DC Machines", "Per-Unit & Fault Analysis", "Power Flow & Transmission", "Power Electronics (Buck/Boost/Inverters)"]
      },
      digital_logic: {
        label: "Digital Logic & Microprocessors",
        subtopics: ["Boolean Algebra & De Morgan", "Logic Gates & K-Maps", "Flip-Flops, Counters & ADC/DAC"]
      }
    }
  },
  english: {
    label: "English & Logic",
    icon: "🔤",
    topics: {
      linguistics_ipa: {
        label: "Linguistics & Phonetics (IPA)",
        subtopics: ["IPA Vowels & Consonants", "Diacritics & Suprasegmentals", "Phonological Rules", "Morphology & Syntax Trees"]
      },
      academic_style: {
        label: "Academic Writing & Citations",
        subtopics: ["Scholarly Citations & Latin Abbreviations", "Typographic Punctuation & Quotes", "Rhetorical Figures & Devices", "Bibliographic Styles (MLA/APA/Chicago)"]
      },
      formal_logic: {
        label: "Formal Logic & Critical Thinking",
        subtopics: ["Propositional Logic Operators", "Rules of Inference", "Syllogisms & Quantifiers", "Logical Fallacies & Truth Tables"]
      }
    }
  }
};

var WIZARD_DOMAIN_MAP = {
  derivative: { domain: "math", topic: "calculus", subtopic: "Derivatives" },
  integral: { domain: "math", topic: "calculus", subtopic: "Definite & Multiple Integrals" },
  matrix: { domain: "math", topic: "linear_algebra", subtopic: "Matrices & Determinants" },
  chemistry: { domain: "chemistry", topic: "reactions", subtopic: "Synthesis & Decomposition" },
  series: { domain: "math", topic: "calculus", subtopic: "Taylor & Maclaurin Series" },
  limit: { domain: "math", topic: "calculus", subtopic: "Limits & Continuity" },
  piecewise: { domain: "math", topic: "algebra", subtopic: "Quadratics & Polynomials" },
  ee_phasor: { domain: "electronics", topic: "dc_ac_circuits", subtopic: "Phasors & Impedance" },
  vector: { domain: "math", topic: "diff_eq", subtopic: "Vector Calculus (Grad/Div/Curl)" },
  corner4: { domain: "physics", topic: "modern_physics", subtopic: "Nuclear Physics" }
};

var WOLFRAM_GUIDE_CATEGORIES = [
  {
    category: "Calculus & Sums",
    items: [
      { syntax: "int(x^2 * sin(x), x, 0, pi)", desc: "Definite integral from 0 to π" },
      { syntax: "int(1/(x^2 + a^2), x)", desc: "Indefinite integral" },
      { syntax: "diff(e^(-2*t) * cos(omega*t), t, 2)", desc: "2nd derivative with respect to t" },
      { syntax: "partial(x^2*y + y^3, x)", desc: "Partial derivative ∂/∂x" },
      { syntax: "lim((sin(x))/x, x -> 0)", desc: "Limit as x approaches 0" },
      { syntax: "sum(x^n / n!, n, 0, inf)", desc: "Infinite summation (Maclaurin series)" },
      { syntax: "prod(1 - x^2/(n^2*pi^2), n, 1, inf)", desc: "Infinite product" }
    ]
  },
  {
    category: "Algebra, Roots & Fractions",
    items: [
      { syntax: "(-b +- sqrt(b^2 - 4*a*c))/(2*a)", desc: "Quadratic formula" },
      { syntax: "(s^2 + 2*zeta*omega_n*s)/(s^3 + 4*s^2 + 2)", desc: "Rational polynomial fraction" },
      { syntax: "root(x^3 + y^3, 3)", desc: "Cube / n-th root" },
      { syntax: "binom(n, k) * p^k * (1-p)^(n-k)", desc: "Binomial probability formula" },
      { syntax: "log2(x) + log10(y) + ln(z)", desc: "Logarithms base 2, 10, and e" }
    ]
  },
  {
    category: "MATLAB Matrices & Vectors",
    items: [
      { syntax: "[1 2 3; 4 5 6; 7 8 9]", desc: "MATLAB 3x3 matrix by rows (;)" },
      { syntax: "[a11 a12; a21 a22]", desc: "Symbolic 2x2 matrix (auto-subscripts)" },
      { syntax: "eye(3)", desc: "3x3 Identity matrix" },
      { syntax: "zeros(3, 4)", desc: "3x4 Zero matrix" },
      { syntax: "diag(lambda_1, lambda_2, lambda_3)", desc: "Diagonal eigenvalue matrix" },
      { syntax: "grad(phi) + div(F) + curl(A)", desc: "Vector calculus operators (∇)" }
    ]
  },
  {
    category: "Electrical Eng & Transforms",
    items: [
      { syntax: "laplace(e^(-a*t) * sin(omega*t))", desc: "Laplace transform L{...}" },
      { syntax: "invlaplace((s + 1)/(s^2 + 2*s + 5))", desc: "Inverse Laplace transform L⁻¹{...}" },
      { syntax: "fourier(x(t))", desc: "Fourier transform F{...}" },
      { syntax: "ztrans(x[n])", desc: "Z-Transform Z{...}" },
      { syntax: "V_m /_ theta deg = V_x + j*V_y", desc: "Phasor angle notation (/_ -> ∠)" }
    ]
  }
];

var EE_FORMALIZATIONS = {
  dc_ac_circuits: {
    label: "1. DC/AC Circuits & Phasors",
    templates: [
      { name: "Phasor Polar ↔ Rectangular", latex: "\\underline{${1:V}} = ${2:V_m}\\angle ${3:\\theta}^{\\circ} = ${4:V_x} + j${5:V_y}" },
      { name: "Series RLC Impedance Z", latex: "\\underline{Z} = ${1:R} + j\\left(\\omega ${2:L} - \\frac{1}{\\omega ${3:C}}\\right) = ${4:|Z|}\\angle ${5:\\phi}^{\\circ}\\;\\Omega" },
      { name: "Voltage Divider Rule", latex: "V_{${1:x}} = ${2:V_s} \\cdot \\frac{${3:R_x}}{${4:R_{eq}}}" },
      { name: "Current Divider Rule", latex: "I_{${1:x}} = ${2:I_s} \\cdot \\frac{${3:G_x}}{${4:G_{eq}}} = ${2:I_s} \\cdot \\frac{${5:R_{other}}}{${6:R_1 + R_2}}" },
      { name: "Complex, Real & Reactive Power", latex: "\\underline{S} = ${1:P} + j${2:Q} = \\underline{${3:V}}\\,\\underline{${4:I}}^* = ${5:|V_{\\text{rms}}||I_{\\text{rms}}|}\\angle ${6:\\theta}^{\\circ}" },
      { name: "Delta-to-Wye (Δ → Y) Conversion", latex: "R_1 = \\frac{${1:R_b}\\,${2:R_c}}{${3:R_a} + ${1:R_b} + ${2:R_c}}" },
      { name: "RLC Resonant Freq & Q-Factor", latex: "\\omega_0 = \\frac{1}{\\sqrt{${1:L}${2:C}}}, \\quad Q = \\frac{\\omega_0 ${1:L}}{${3:R}} = \\frac{1}{${3:R}}\\sqrt{\\frac{${1:L}}{${2:C}}}" }
    ]
  },
  network_theorems: {
    label: "2. Network Theorems & Two-Port",
    templates: [
      { name: "Thevenin Equivalent Load Current", latex: "I_L = \\frac{${1:V_{\\text{Th}}}}{${2:Z_{\\text{Th}}} + ${3:Z_L}}, \\quad P_{\\max} = \\frac{|${1:V_{\\text{Th}}}|^2}{4\\,${4:R_{\\text{Th}}}}" },
      { name: "Two-Port Impedance (Z-Parameters)", latex: "\\begin{bmatrix} ${1:V_1} \\\\ ${2:V_2} \\end{bmatrix} = \\begin{bmatrix} ${3:Z_{11}} & ${4:Z_{12}} \\\\ ${5:Z_{21}} & ${6:Z_{22}} \\end{bmatrix} \\begin{bmatrix} ${7:I_1} \\\\ ${8:I_2} \\end{bmatrix}" },
      { name: "Two-Port Admittance (Y-Parameters)", latex: "\\begin{bmatrix} ${1:I_1} \\\\ ${2:I_2} \\end{bmatrix} = \\begin{bmatrix} ${3:Y_{11}} & ${4:Y_{12}} \\\\ ${5:Y_{21}} & ${6:Y_{22}} \\end{bmatrix} \\begin{bmatrix} ${7:V_1} \\\\ ${8:V_2} \\end{bmatrix}" },
      { name: "Two-Port Transmission (ABCD Matrix)", latex: "\\begin{bmatrix} ${1:V_1} \\\\ ${2:I_1} \\end{bmatrix} = \\begin{bmatrix} ${3:A} & ${4:B} \\\\ ${5:C} & ${6:D} \\end{bmatrix} \\begin{bmatrix} ${7:V_2} \\\\ ${8:-I_2} \\end{bmatrix}" }
    ]
  },
  analog_electronics: {
    label: "3. Analog: Diodes, BJT, MOSFET & Op-Amps",
    templates: [
      { name: "Shockley Diode Equation", latex: "I_D = ${1:I_S}\\left(e^{\\frac{${2:V_D}}{${3:n}\\,${4:V_T}}} - 1\\right)" },
      { name: "BJT Collector Current & Gain", latex: "I_C = ${1:\\beta}\\,I_B = ${2:I_S}\\,e^{\\frac{V_{BE}}{V_T}}, \\quad g_m = \\frac{I_C}{V_T}" },
      { name: "MOSFET Saturation Current", latex: "I_D = \\frac{1}{2}${1:\\mu_n C_{\\text{ox}}}\\left(\\frac{${2:W}}{${3:L}}\\right)\\left(${4:V_{GS}} - ${5:V_{th}}\\right)^2 (1 + \\lambda V_{DS})" },
      { name: "Op-Amp Differential / Instrumentation", latex: "V_{\\text{out}} = -\\frac{${1:R_f}}{${2:R_{\\text{in}}}}V_1 + \\left(1 + \\frac{${1:R_f}}{${2:R_{\\text{in}}}}\\right)\\left(\\frac{${3:R_4}}{${4:R_3} + ${3:R_4}}\\right)V_2" }
    ]
  },
  signals_systems: {
    label: "4. Signals & Systems (Laplace/Fourier/Z)",
    templates: [
      { name: "Continuous-Time Convolution", latex: "y(t) = ${1:x(t)} * ${2:h(t)} = \\int_{-\\infty}^{\\infty} ${3:x(\\tau)}\\,${4:h(t - \\tau)}\\,d\\tau" },
      { name: "Unilateral Laplace Transform", latex: "\\mathcal{L}\\{${1:f(t)}\\} = F(s) = \\int_{0^-}^{\\infty} ${1:f(t)}\\,e^{-st}\\,dt" },
      { name: "Continuous-Time Fourier Transform", latex: "X(j\\omega) = \\int_{-\\infty}^{\\infty} ${1:x(t)}\\,e^{-j\\omega t}\\,dt" },
      { name: "Bilateral Z-Transform", latex: "X(z) = \\sum_{n=-\\infty}^{\\infty} ${1:x[n]}\\,z^{-n}" }
    ]
  },
  control_systems: {
    label: "5. Control Systems & State-Space",
    templates: [
      { name: "Standard 2nd-Order Transfer Function", latex: "H(s) = \\frac{${1:K}\\,\\omega_n^2}{s^2 + 2\\,${2:\\zeta}\\,${3:\\omega_n}s + ${3:\\omega_n}^2}" },
      { name: "Zero-Pole-Gain Transfer Function", latex: "G(s) = ${1:K}\\frac{(s - ${2:z_1})(s - ${3:z_2})}{(s - ${4:p_1})(s - ${5:p_2})}" },
      { name: "PID Controller Transfer Function", latex: "G_c(s) = ${1:K_p} + \\frac{${2:K_i}}{s} + ${3:K_d}s = ${1:K_p}\\left(1 + \\frac{1}{${4:T_i}s} + ${5:T_d}s\\right)" },
      { name: "State-Space Representation (ẋ = Ax + Bu)", latex: "\\begin{aligned} \\dot{\\mathbf{x}}(t) &= ${1:\\mathbf{A}}\\mathbf{x}(t) + ${2:\\mathbf{B}}\\mathbf{u}(t) \\\\ \\mathbf{y}(t) &= ${3:\\mathbf{C}}\\mathbf{x}(t) + ${4:\\mathbf{D}}\\mathbf{u}(t) \\end{aligned}" },
      { name: "State Transition Resolvent Matrix Φ(s)", latex: "\\mathbf{\\Phi}(s) = (s\\mathbf{I} - ${1:\\mathbf{A}})^{-1}, \\quad H(s) = ${2:\\mathbf{C}}(s\\mathbf{I} - ${1:\\mathbf{A}})^{-1}${3:\\mathbf{B}} + ${4:\\mathbf{D}}" }
    ]
  },
  electromagnetics_rf: {
    label: "6. Electromagnetics & Transmission Lines",
    templates: [
      { name: "Transmission Line Characteristic Impedance Z₀", latex: "Z_0 = \\sqrt{\\frac{${1:R} + j\\omega ${2:L}}{${3:G} + j\\omega ${4:C}}} \\approx \\sqrt{\\frac{${2:L}}{${4:C}}}" },
      { name: "Reflection Coefficient Γ & VSWR", latex: "\\Gamma = \\frac{${1:Z_L} - ${2:Z_0}}{${1:Z_L} + ${2:Z_0}}, \\quad \\text{VSWR} = \\frac{1 + |\\Gamma|}{1 - |\\Gamma|}" },
      { name: "Input Impedance Zin(d) Along Line", latex: "Z_{\\text{in}}(d) = ${1:Z_0}\\,\\frac{${2:Z_L} + j${1:Z_0}\\tan(\\beta d)}{${1:Z_0} + j${2:Z_L}\\tan(\\beta d)}" },
      { name: "Poynting Vector & Skin Depth δ", latex: "\\mathbf{S} = ${1:\\mathbf{E}} \\times ${2:\\mathbf{H}}, \\quad \\delta = \\frac{1}{\\sqrt{\\pi ${3:f}\\,${4:\\mu}\\,${5:\\sigma}}}" }
    ]
  },
  power_machines: {
    label: "7. Power Systems, Machines & Power Elec",
    templates: [
      { name: "3-Phase Real, Reactive & Apparent Power", latex: "P_{3\\phi} = \\sqrt{3}\\,${1:V_L}\\,${2:I_L}\\cos(${3:\\theta}), \\quad Q_{3\\phi} = \\sqrt{3}\\,${1:V_L}\\,${2:I_L}\\sin(${3:\\theta})" },
      { name: "Transformer EMF & Turns Ratio", latex: "E_{\\text{rms}} = 4.44\\,${1:f}\\,${2:N}\\,${3:\\Phi_{\\max}}, \\quad \\frac{V_1}{V_2} = \\frac{N_1}{N_2} = \\frac{I_2}{I_1} = a" },
      { name: "Induction Motor Sync Speed & Slip s", latex: "n_s = \\frac{120\\,${1:f}}{${2:P}}, \\quad s = \\frac{n_s - ${3:n_r}}{n_s}" },
      { name: "Synchronous Generator Power-Angle Curve", latex: "P_e = \\frac{3\\,${1:V_t}\\,${2:E_f}}{${3:X_s}}\\sin(${4:\\delta})" },
      { name: "Synchronous Machine Swing Equation", latex: "\\frac{2${1:H}}{\\omega_s}\\frac{d^2 ${2:\\delta}}{dt^2} = ${3:P_m} - ${4:P_e}" }
    ]
  },
  digital_logic: {
    label: "8. Digital Logic & Boolean Formalizations",
    templates: [
      { name: "Canonical Sum of Minterms (∑ m)", latex: "F(${1:A, B, C}) = \\sum m(${2:1, 3, 5, 7}) + d(${3:2})" },
      { name: "Canonical Product of Maxterms (∏ M)", latex: "F(${1:A, B, C}) = \\prod M(${2:0, 2, 4, 6})" },
      { name: "De Morgan's Theorems", latex: "\\overline{${1:A} \\cdot ${2:B}} = \\overline{${1:A}} + \\overline{${2:B}}, \\quad \\overline{${1:A} + ${2:B}} = \\overline{${1:A}} \\cdot \\overline{${2:B}}" },
      { name: "ADC Signal-to-Quantization-Noise Ratio", latex: "\\text{SQNR}_{\\text{dB}} = 6.02\\,${1:N} + 1.76\\;\\text{dB}" }
    ]
  }
};

var SOLVER_PRESETS = [
  {
    id: "trig-proof",
    name: "Math: Trigonometric Identity Proof",
    domain: "math",
    steps: [
      { rel: "\\text{LHS} =", expr: "\\frac{\\sin(2\\theta)}{1 + \\cos(2\\theta)}", note: "Start with Left-Hand Side" },
      { rel: "=", expr: "\\frac{2\\sin\\theta\\cos\\theta}{2\\cos^2\\theta}", note: "Apply double-angle identities" },
      { rel: "=", expr: "\\tan\\theta = \\text{RHS}", note: "Cancel 2cos(θ)" }
    ]
  },
  {
    id: "calc-diff",
    name: "Calculus: Step-by-Step Differentiation",
    domain: "math",
    steps: [
      { rel: "y =", expr: "e^{-2x}\\sin(3x)", note: "Given function" },
      { rel: "\\frac{dy}{dx} =", expr: "\\frac{d}{dx}(e^{-2x})\\cdot\\sin(3x) + e^{-2x}\\cdot\\frac{d}{dx}(\\sin(3x))", note: "Apply Product Rule" },
      { rel: "=", expr: "e^{-2x}\\left(3\\cos(3x) - 2\\sin(3x)\\right)", note: "Factor out e^{-2x}" }
    ]
  },
  {
    id: "calc-int",
    name: "Calculus: Definite Integral Evaluation",
    domain: "math",
    steps: [
      { rel: "I =", expr: "\\int_{0}^{\\pi/2} \\cos(x)\\,dx", note: "Definite integral" },
      { rel: "=", expr: "\\Big[ \\sin(x) \\Big]_{0}^{\\pi/2}", note: "Find antiderivative" },
      { rel: "=", expr: "\\sin(\\pi/2) - \\sin(0) = 1", note: "Fundamental Theorem of Calculus" }
    ]
  },
  {
    id: "phys-kin",
    name: "Physics: Kinematics / Force Derivation",
    domain: "physics",
    steps: [
      { rel: "\\text{Given:}", expr: "u = 0\\text{ m/s},\\; a = 9.8\\text{ m/s}^2,\\; t = 3\\text{ s}", note: "Initial parameters" },
      { rel: "s =", expr: "ut + \\frac{1}{2}at^2", note: "2nd Equation of Motion" },
      { rel: "s =", expr: "(0)(3) + \\frac{1}{2}(9.8)(3)^2 = 44.1\\text{ m}", note: "Substitute & solve" }
    ]
  },
  {
    id: "chem-equil",
    name: "Chemistry: Weak Acid pH & Ka Calculation",
    domain: "chemistry",
    steps: [
      { rel: "K_a =", expr: "\\frac{[\\mathrm{H^+}][\\mathrm{A^-}]}{[\\mathrm{HA}]} = \\frac{x^2}{C - x}", note: "Equilibrium expression" },
      { rel: "\\approx", expr: "\\frac{x^2}{C} \\implies x = \\sqrt{K_a \\cdot C}", note: "Assuming x << C" },
      { rel: "\\mathrm{pH} =", expr: "-\\log_{10}(x)", note: "Calculate final pH" }
    ]
  },
  {
    id: "ee-nodal",
    name: "Electrical Eng: KCL Nodal & Phasor Solution",
    domain: "electronics",
    steps: [
      { rel: "\\text{KCL at } V_A:", expr: "\\frac{V_A - V_S}{R_1} + \\frac{V_A}{R_2} + \\frac{V_A}{j\\omega L} = 0", note: "Sum of currents leaving node = 0" },
      { rel: "\\implies", expr: "V_A\\left(\\frac{1}{R_1} + \\frac{1}{R_2} - j\\frac{1}{\\omega L}\\right) = \\frac{V_S}{R_1}", note: "Group admittance terms" },
      { rel: "V_A =", expr: "\\frac{V_S / R_1}{Y_{\\text{total}}} = |V_A|\\angle\\theta^{\\circ}\\text{ V}", note: "Solve for Phasor Voltage" }
    ]
  }
];

// ============================================================================
// 2. WOLFRAM ALPHA / MAPLE / MATLAB NATURAL MATH TO LATEX ENGINE
// ============================================================================

function splitTopLevelArgs(str, delimiter) {
  var delim = delimiter || ",";
  var res = [];
  var depth = 0;
  var last = 0;
  for (var i = 0; i < str.length; i++) {
    var ch = str[i];
    if (ch === "(" || ch === "[" || ch === "{") depth++;
    else if (ch === ")" || ch === "]" || ch === "}") depth = Math.max(0, depth - 1);
    else if (depth === 0 && str.slice(i, i + delim.length) === delim) {
      res.push(str.slice(last, i).trim());
      last = i + delim.length;
      i += delim.length - 1;
    }
  }
  res.push(str.slice(last).trim());
  return res;
}

function replaceBalancedFunction(input, fnNames, transformFn) {
  var namesPattern = fnNames.join("|");
  var regex = new RegExp("\\b(" + namesPattern + ")\\s*\\(", "i");
  var str = input;
  var safety = 0;

  while (safety++ < 60) {
    var match = regex.exec(str);
    if (!match) break;
    var fnName = match[1].toLowerCase();
    var openParenIdx = match.index + match[0].length - 1;
    var depth = 1;
    var i = openParenIdx + 1;
    while (i < str.length && depth > 0) {
      if (str[i] === "(") depth++;
      else if (str[i] === ")") depth--;
      if (depth > 0) i++;
    }
    if (depth !== 0) break;
    var inner = str.slice(openParenIdx + 1, i);
    var args = splitTopLevelArgs(inner, ",");
    var replacement = transformFn(fnName, args, inner);
    str = str.slice(0, match.index) + replacement + str.slice(i + 1);
  }
  return str;
}

function convertSlashFractions(str) {
  var out = str;
  var safety = 0;
  while (safety++ < 40) {
    var slashIdx = -1;
    for (var k = 0; k < out.length; k++) {
      if (out[k] === "/" && out[k - 1] !== "\\" && out[k - 1] !== "<" && out[k + 1] !== "_") {
        slashIdx = k;
        break;
      }
    }
    if (slashIdx === -1) break;

    var lEnd = slashIdx - 1;
    while (lEnd >= 0 && out[lEnd] === " ") lEnd--;
    if (lEnd < 0) break;

    var lStart = lEnd;
    if (out[lEnd] === ")" || out[lEnd] === "}") {
      var closeCh = out[lEnd];
      var openCh = closeCh === ")" ? "(" : "{";
      var depth = 1;
      lStart = lEnd - 1;
      while (lStart >= 0 && depth > 0) {
        if (out[lStart] === closeCh) depth++;
        else if (out[lStart] === openCh) depth--;
        if (depth > 0) lStart--;
      }
      while (lStart > 0 && /[a-zA-Z0-9_\\^]/.test(out[lStart - 1])) lStart--;
    } else {
      while (lStart > 0 && /[a-zA-Z0-9_.^\\{}]/.test(out[lStart - 1])) lStart--;
    }

    var rStart = slashIdx + 1;
    while (rStart < out.length && out[rStart] === " ") rStart++;
    if (rStart >= out.length) break;

    var rEnd = rStart;
    if (out[rStart] === "(" || out[rStart] === "{") {
      var oCh = out[rStart];
      var cCh = oCh === "(" ? ")" : "}";
      var rDepth = 1;
      rEnd = rStart + 1;
      while (rEnd < out.length && rDepth > 0) {
        if (out[rEnd] === oCh) rDepth++;
        else if (out[rEnd] === cCh) rDepth--;
        if (rDepth > 0) rEnd++;
      }
      rEnd++;
    } else {
      while (rEnd < out.length && /[a-zA-Z0-9_.^\\{}]/.test(out[rEnd])) rEnd++;
    }

    var num = out.slice(lStart, lEnd + 1).trim();
    var den = out.slice(rStart, rEnd).trim();
    if (num.startsWith("(") && num.endsWith(")")) num = num.slice(1, -1).trim();
    if (den.startsWith("(") && den.endsWith(")")) den = den.slice(1, -1).trim();

    out = out.slice(0, lStart) + "\\frac{" + num + "}{" + den + "}" + out.slice(rEnd);
  }
  return out;
}

function wolframNaturalToLatex(rawInput) {
  if (!rawInput || !rawInput.trim()) return "";
  var s = rawInput.trim();

  var matParsed = parseMatlabMatrixInput(s, "bmatrix");
  if (matParsed) return matParsed.latex;

  s = s.replace(/\/_|<_/g, " \\angle ");

  s = replaceBalancedFunction(
    s,
    [
      "int", "integrate", "iint", "iiint", "oint",
      "diff", "deriv", "d", "partial", "pderiv",
      "lim", "limit",
      "sum", "summation", "prod", "product",
      "sqrt", "cbrt", "root", "nthroot",
      "abs", "norm", "floor", "ceil",
      "laplace", "invlaplace", "fourier", "invfourier", "ztrans", "invztrans",
      "grad", "gradient", "div", "divergence", "curl", "dot", "cross", "det", "inv", "trace", "rank",
      "taylor", "maclaurin", "convol", "conv", "sinc", "erf",
      "binom", "nCr", "choose", "log10", "log2", "logb", "exp"
    ],
    function(fn, args) {
      var a0 = args[0] ? wolframNaturalToLatex(args[0]) : "f(x)";
      var a1 = args[1] ? wolframNaturalToLatex(args[1]) : "x";
      var a2 = args[2] ? wolframNaturalToLatex(args[2]) : "";
      var a3 = args[3] ? wolframNaturalToLatex(args[3]) : "";

      if (fn === "int" || fn === "integrate") {
        if (args[1] && args[1].indexOf("..") !== -1) {
          var eqParts = args[1].split("=");
          var vName = eqParts.length > 1 ? eqParts[0].trim() : "x";
          var bounds = (eqParts[1] || eqParts[0]).split("..");
          return "\\int_{" + wolframNaturalToLatex(bounds[0]) + "}^{" + wolframNaturalToLatex(bounds[1]) + "} \\left(" + a0 + "\\right)\\,d" + vName;
        }
        if (args.length >= 4) {
          return "\\int_{" + a2 + "}^{" + a3 + "} \\left(" + a0 + "\\right)\\,d" + a1;
        }
        return "\\int \\left(" + a0 + "\\right)\\,d" + (args[1] ? a1 : "x");
      }
      if (fn === "iint") return "\\iint_{" + (args[1] ? a1 : "D") + "} " + a0 + "\\,dA";
      if (fn === "iiint") return "\\iiint_{" + (args[1] ? a1 : "V") + "} " + a0 + "\\,dV";
      if (fn === "oint") return "\\oint_{" + (args[1] ? a1 : "C") + "} " + a0 + "\\cdot d\\mathbf{r}";

      if (fn === "diff" || fn === "deriv" || fn === "d") {
        if (args.length >= 3) {
          return "\\frac{d^{" + a2 + "}}{d" + a1 + "^{" + a2 + "}}\\left(" + a0 + "\\right)";
        }
        return "\\frac{d}{d" + a1 + "}\\left(" + a0 + "\\right)";
      }
      if (fn === "partial" || fn === "pderiv") {
        if (args.length >= 3) {
          return "\\frac{\\partial^{" + a2 + "} " + a0 + "}{\\partial " + a1 + "^{" + a2 + "}}";
        }
        return "\\frac{\\partial " + a0 + "}{\\partial " + a1 + "}";
      }

      if (fn === "lim" || fn === "limit") {
        if (args[1] && (args[1].indexOf("->") !== -1 || args[1].indexOf("=") !== -1)) {
          var pts = args[1].split(/->|=/);
          return "\\lim_{" + wolframNaturalToLatex(pts[0]) + " \\to " + wolframNaturalToLatex(pts[1]) + "} \\left(" + a0 + "\\right)";
        }
        return "\\lim_{" + a1 + " \\to " + (a2 || "0") + "} \\left(" + a0 + "\\right)";
      }

      if (fn === "sum" || fn === "summation" || fn === "prod" || fn === "product") {
        var sym = (fn === "sum" || fn === "summation") ? "\\sum" : "\\prod";
        if (args[1] && args[1].indexOf("..") !== -1) {
          var sParts = args[1].split("..");
          return sym + "_{" + wolframNaturalToLatex(sParts[0]) + "}^{" + wolframNaturalToLatex(sParts[1]) + "} \\left(" + a0 + "\\right)";
        }
        if (args.length >= 4) {
          return sym + "_{" + a1 + "=" + a2 + "}^{" + a3 + "} \\left(" + a0 + "\\right)";
        }
        return sym + "_{" + (args[1] ? a1 : "n=1") + "}^{\\infty} \\left(" + a0 + "\\right)";
      }

      if (fn === "sqrt") return "\\sqrt{" + a0 + "}";
      if (fn === "cbrt") return "\\sqrt[3]{" + a0 + "}";
      if (fn === "root" || fn === "nthroot") return "\\sqrt[" + (a1 || "n") + "]{" + a0 + "}";
      if (fn === "abs") return "\\left|" + a0 + "\\right|";
      if (fn === "norm") return "\\left\\|" + a0 + "\\right\\|";
      if (fn === "floor") return "\\lfloor " + a0 + " \\rfloor";
      if (fn === "ceil") return "\\lceil " + a0 + " \\rceil";
      if (fn === "exp") return "e^{" + a0 + "}";
      if (fn === "log10") return "\\log_{10}\\left(" + a0 + "\\right)";
      if (fn === "log2") return "\\log_{2}\\left(" + a0 + "\\right)";
      if (fn === "logb") return "\\log_{" + a1 + "}\\left(" + a0 + "\\right)";
      if (fn === "binom" || fn === "ncr" || fn === "choose") return "\\binom{" + a0 + "}{" + a1 + "}";
      if (fn === "laplace") return "\\mathcal{L}\\left\\{" + a0 + "\\right\\}";
      if (fn === "invlaplace") return "\\mathcal{L}^{-1}\\left\\{" + a0 + "\\right\\}";
      if (fn === "fourier") return "\\mathcal{F}\\left\\{" + a0 + "\\right\\}";
      if (fn === "invfourier") return "\\mathcal{F}^{-1}\\left\\{" + a0 + "\\right\\}";
      if (fn === "ztrans") return "\\mathcal{Z}\\left\\{" + a0 + "\\right\\}";
      if (fn === "invztrans") return "\\mathcal{Z}^{-1}\\left\\{" + a0 + "\\right\\}";
      if (fn === "convol" || fn === "conv") return a0 + " * " + a1;
      if (fn === "sinc") return "\\operatorname{sinc}\\left(" + a0 + "\\right)";
      if (fn === "erf") return "\\operatorname{erf}\\left(" + a0 + "\\right)";
      if (fn === "grad" || fn === "gradient") return "\\nabla " + a0;
      if (fn === "div" || fn === "divergence") return "\\nabla \\cdot \\mathbf{" + a0 + "}";
      if (fn === "curl") return "\\nabla \\times \\mathbf{" + a0 + "}";
      if (fn === "dot") return "\\mathbf{" + a0 + "} \\cdot \\mathbf{" + a1 + "}";
      if (fn === "cross") return "\\mathbf{" + a0 + "} \\times \\mathbf{" + a1 + "}";
      if (fn === "det") return "\\det\\left(" + a0 + "\\right)";
      if (fn === "inv") return "\\left(" + a0 + "\\right)^{-1}";
      if (fn === "trace") return "\\operatorname{tr}\\left(" + a0 + "\\right)";
      if (fn === "rank") return "\\operatorname{rank}\\left(" + a0 + "\\right)";
      if (fn === "taylor") {
        return "\\sum_{n=0}^{" + (a3 || "\\infty") + "} \\frac{" + a0 + "^{(n)}(" + (a2 || "a") + ")}{n!}(" + (a1 || "x") + " - " + (a2 || "a") + ")^n";
      }
      if (fn === "maclaurin") {
        return "\\sum_{n=0}^{" + (a2 || "\\infty") + "} \\frac{" + a0 + "^{(n)}(0)}{n!}(" + (a1 || "x") + ")^n";
      }
      return fn + "(" + a0 + ")";
    }
  );

  s = s.replace(/\bd\/d([a-zA-Z])\s*\(([^)]+)\)/g, "\\frac{d}{d$1}\\left($2\\right)");
  s = s.replace(/\bd\^(\d+)\/d([a-zA-Z])\^\1\s*\(([^)]+)\)/g, "\\frac{d^{$1}}{d$2^{$1}}\\left($3\\right)");

  s = s.replace(/\^\(([^)]+)\)/g, "^{$1}");
  s = s.replace(/_\(([^)]+)\)/g, "_{$1}");
  s = s.replace(/\^([a-zA-Z0-9]{2,})\b/g, "^{$1}");
  s = s.replace(/_([a-zA-Z0-9]{2,})\b/g, "_{$1}");

  s = convertSlashFractions(s);

  s = s.replace(/<->|<=>/g, " \\leftrightarrow ");
  s = s.replace(/=>|==>/g, " \\implies ");
  s = s.replace(/->/g, " \\to ");
  s = s.replace(/<=/g, " \\le ");
  s = s.replace(/>=/g, " \\ge ");
  s = s.replace(/!=|~=/g, " \\neq ");
  s = s.replace(/\+-/g, " \\pm ");
  s = s.replace(/~~|approx/g, " \\approx ");
  s = s.replace(/\bdeg\b/g, "^{\\circ}");
  s = s.replace(/\boo\b|\binfinity\b|\binf\b/gi, "\\infty");
  s = s.replace(/\s*\*\s*/g, " \\cdot ");

  s = s.replace(/\b(arcsin|arccos|arctan|sinh|cosh|tanh|sin|cos|tan|csc|sec|cot|ln|log)\b/g, "\\$1");
  s = s.replace(/\b(asin|acos|atan)\b/g, function(_, m) { return "\\arc" + m.slice(1); });

  var greeks = [
    "alpha", "beta", "gamma", "delta", "epsilon", "varepsilon", "zeta", "eta", "theta",
    "kappa", "lambda", "mu", "nu", "xi", "pi", "rho", "sigma", "tau", "phi", "chi", "psi", "omega",
    "Gamma", "Delta", "Theta", "Lambda", "Xi", "Pi", "Sigma", "Phi", "Psi", "Omega", "hbar", "nabla"
  ];
  var greekRegex = new RegExp("(?<!\\\\)\\b(" + greeks.join("|") + ")\\b", "g");
  s = s.replace(greekRegex, "\\$1");

  return s.trim();
}

// ============================================================================
// 3. SMART MATRIX CELL FORMATTER & MATLAB PARSER (Fixes b25 -> b_{25} & Sizing)
// ============================================================================

function autoFormatMatrixCellToken(cellStr, autoSubscriptEnabled) {
  if (!cellStr) return "0";
  var t = cellStr.trim();
  if (!autoSubscriptEnabled) return t;
  if (/^([a-zA-Z]|\\[a-zA-Z]+)_?(\d+)$/.test(t)) {
    return t.replace(/^([a-zA-Z]|\\[a-zA-Z]+)_?(\d+)$/, "$1_{$2}");
  }
  var openCount = (t.match(/\{/g) || []).length;
  var closeCount = (t.match(/\}/g) || []).length;
  if (openCount > closeCount) {
    t += "}".repeat(openCount - closeCount);
  }
  return t;
}

function parseMatlabMatrixInput(raw, bracketType) {
  if (!raw || !raw.trim()) return null;
  var s = raw.trim();
  var env = bracketType || "bmatrix";
  var cells = null;

  var eyeMatch = s.match(/^eye\(\s*(\d+)\s*\)$/i);
  if (eyeMatch) {
    var n = Math.min(6, Math.max(1, Number(eyeMatch[1])));
    cells = [];
    for (var r = 0; r < n; r++) {
      var row = [];
      for (var c = 0; c < n; c++) row.push(r === c ? "1" : "0");
      cells.push(row);
    }
  }

  var zoMatch = s.match(/^(zeros|ones)\(\s*(\d+)\s*(?:,\s*(\d+)\s*)?\)$/i);
  if (!cells && zoMatch) {
    var fill = zoMatch[1].toLowerCase() === "ones" ? "1" : "0";
    var nr = Math.min(6, Math.max(1, Number(zoMatch[2])));
    var nc = zoMatch[3] ? Math.min(6, Math.max(1, Number(zoMatch[3]))) : nr;
    cells = [];
    for (var r2 = 0; r2 < nr; r2++) {
      var row2 = [];
      for (var c2 = 0; c2 < nc; c2++) row2.push(fill);
      cells.push(row2);
    }
  }

  var diagMatch = s.match(/^diag\(\s*([^)]+)\s*\)$/i);
  if (!cells && diagMatch) {
    var dParts = diagMatch[1].split(",").map(function(x) { return autoFormatMatrixCellToken(x.trim(), true); }).filter(Boolean);
    var dn = dParts.length;
    cells = [];
    for (var r3 = 0; r3 < dn; r3++) {
      var row3 = [];
      for (var c3 = 0; c3 < dn; c3++) row3.push(r3 === c3 ? dParts[r3] : "0");
      cells.push(row3);
    }
  }

  if (!cells && s.startsWith("[[") && s.endsWith("]]")) {
    var innerW = s.slice(1, -1).trim();
    var wRows = splitTopLevelArgs(innerW, ",");
    cells = wRows.map(function(rw) {
      var clean = rw.replace(/^\[|\]$/g, "").trim();
      return clean.split(",").map(function(c) { return autoFormatMatrixCellToken(c.trim() || "0", true); });
    });
  }

  if (!cells && s.startsWith("[") && s.endsWith("]") && s.indexOf(";") !== -1) {
    var innerM = s.slice(1, -1).trim();
    var mRows = innerM.split(";");
    cells = mRows.map(function(rw) {
      var trimmed = rw.trim();
      var parts = trimmed.indexOf(",") !== -1 ? trimmed.split(",") : trimmed.split(/\s+/);
      return parts.filter(Boolean).map(function(c) { return autoFormatMatrixCellToken(c.trim(), true); });
    });
  }

  if (!cells || cells.length === 0) return null;

  var rowsCount = cells.length;
  var colsCount = cells[0].length;
  var slotNum = 1;
  var lines = cells.map(function(row) {
    return "  " + row.map(function(val) {
      var out = "${" + slotNum + ":" + val + "}";
      slotNum++;
      return out;
    }).join(" & ");
  });

  return {
    rows: rowsCount,
    cols: colsCount,
    cells: cells,
    latex: "\\begin{" + env + "}\n" + lines.join(" \\\\\n") + "\n\\end{" + env + "}"
  };
}

// ============================================================================
// 4. CASE-INSENSITIVE CHEMICAL ENGINE & STOICHIOMETRY BALANCER (Fixes 'ph4'!)
// ============================================================================

var ELEMENTS_LIST = [
  "He","Li","Be","Ne","Na","Mg","Al","Si","Cl","Ar","Ca","Sc","Ti","Cr","Mn","Fe","Co","Ni","Cu","Zn",
  "Ga","Ge","As","Se","Br","Kr","Rb","Sr","Zr","Nb","Mo","Tc","Ru","Rh","Pd","Ag","Cd","In","Sn","Sb",
  "Te","Xe","Cs","Ba","La","Ce","Pr","Nd","Pm","Sm","Eu","Gd","Tb","Dy","Ho","Er","Tm","Yb","Lu","Hf",
  "Ta","Re","Os","Ir","Pt","Au","Hg","Tl","Pb","Bi","Po","At","Rn","Fr","Ra","Ac","Th","Pa","Np","Pu",
  "Am","Cm","Bk","Cf","Es","Fm","Md","No","Lr","Rf","Db","Sg","Bh","Hs","Mt","Ds","Rg","Cn","Nh","Fl",
  "Mc","Lv","Ts","Og",
  "H","B","C","N","O","F","P","S","K","V","Y","I","W","U","e"
];
var VALID_ELEMENTS = new Set(ELEMENTS_LIST);

function normalizeChemicalFormulaInput(raw) {
  if (!raw) return "";
  var s = raw.trim().replace(/\s+/g, "");
  if (s === "e" || s === "e-") return "e";

  var plain = s.replace(/_/g, "").replace(/\{|\}/g, "");
  var out = "";
  var i = 0;

  while (i < plain.length) {
    var ch = plain[i];
    if (ch === "(" || ch === ")" || ch === "[" || ch === "]" || ch === "·" || ch === "." || ch === "*") {
      out += ch;
      i++;
      continue;
    }
    if (/[0-9]/.test(ch)) {
      var num = "";
      while (i < plain.length && /[0-9]/.test(plain[i])) {
        num += plain[i];
        i++;
      }
      out += "_" + num;
      continue;
    }
    if (/[a-zA-Z]/.test(ch)) {
      var twoChars = plain.slice(i, i + 2);
      var matchedTwo = null;
      if (twoChars.length === 2 && /[a-zA-Z]{2}/.test(twoChars)) {
        var capTwo = twoChars[0].toUpperCase() + twoChars[1].toLowerCase();
        var secondWasLower = /[a-z]/.test(twoChars[1]);
        var firstIsSingleElement = VALID_ELEMENTS.has(twoChars[0].toUpperCase());
        if (VALID_ELEMENTS.has(capTwo) && ((secondWasLower && /[A-Z]/.test(twoChars[0])) || !firstIsSingleElement)) {
          matchedTwo = capTwo;
        } else if (VALID_ELEMENTS.has(capTwo) && /[a-z]/.test(twoChars[0])) {
          var ambiguousTwo = new Set(["Co", "No", "Po", "So", "Ho", "Os", "In", "Sc", "Sn", "Pr", "Pa", "Nb"]);
          if (!ambiguousTwo.has(capTwo)) {
            matchedTwo = capTwo;
          }
        }
      }

      if (matchedTwo) {
        out += matchedTwo;
        i += 2;
      } else {
        out += ch.toUpperCase();
        i += 1;
      }
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

function parseChemicalFormulaCounts(rawFormula) {
  var normalized = normalizeChemicalFormulaInput(rawFormula);
  var clean = normalized.replace(/_/g, "").replace(/\{|\}/g, "").replace(/\s+/g, "");
  if (!clean) return { valid: false, error: "Empty formula", counts: {}, normalized: "" };
  if (clean === "e") return { valid: true, counts: {}, normalized: "e" };

  // Strip ionic charge notation like ^2+, ^-, 2+, +, - if embedded directly in formula
  clean = clean.replace(/\^?[0-9]*[+-]/g, "");

  // Handle hydrate notation (e.g. CuSO4·5H2O, FeSO4.7H2O, BaCl2*2H2O)
  if (clean.indexOf("·") !== -1 || clean.indexOf("*") !== -1 || (clean.indexOf(".") !== -1 && /[0-9]/.test(clean.charAt(clean.indexOf(".") + 1)))) {
    var parts = clean.split(/[·*.]/);
    var baseResult = parseChemicalFormulaCounts(parts[0]);
    if (!baseResult.valid) return baseResult;
    var totalCounts = Object.assign({}, baseResult.counts);
    for (var p = 1; p < parts.length; p++) {
      var hydratePart = parts[p];
      var m = hydratePart.match(/^(\d+)(.*)$/);
      var mult = m ? parseInt(m[1], 10) : 1;
      var subFormula = m ? m[2] : hydratePart;
      var subResult = parseChemicalFormulaCounts(subFormula || "H2O");
      if (!subResult.valid) return subResult;
      Object.keys(subResult.counts).forEach(function(el) {
        totalCounts[el] = (totalCounts[el] || 0) + subResult.counts[el] * mult;
      });
    }
    return { valid: true, counts: totalCounts, normalized: normalized };
  }

  var stack = [{}];
  var i = 0;
  while (i < clean.length) {
    var ch = clean[i];
    if (ch === "(" || ch === "[") {
      stack.push({});
      i++;
    } else if (ch === ")" || ch === "]") {
      if (stack.length < 2) return { valid: false, error: "Unmatched ) in " + rawFormula, counts: {}, normalized: normalized };
      var popped = stack.pop();
      i++;
      var multStr = "";
      while (i < clean.length && /[0-9]/.test(clean[i])) {
        multStr += clean[i];
        i++;
      }
      var mult = multStr ? parseInt(multStr, 10) : 1;
      var top = stack[stack.length - 1];
      Object.keys(popped).forEach(function(el) {
        top[el] = (top[el] || 0) + popped[el] * mult;
      });
    } else if (/[A-Z]/.test(ch)) {
      var sym = ch;
      i++;
      while (i < clean.length && /[a-z]/.test(clean[i])) {
        sym += clean[i];
        i++;
      }
      if (!VALID_ELEMENTS.has(sym)) {
        return { valid: false, error: "Unknown element '" + sym + "'", counts: {}, normalized: normalized };
      }
      var numStr = "";
      while (i < clean.length && /[0-9]/.test(clean[i])) {
        numStr += clean[i];
        i++;
      }
      var count = numStr ? parseInt(numStr, 10) : 1;
      var cur = stack[stack.length - 1];
      cur[sym] = (cur[sym] || 0) + count;
    } else {
      return { valid: false, error: "Invalid character '" + ch + "'", counts: {}, normalized: normalized };
    }
  }

  if (stack.length !== 1) return { valid: false, error: "Unclosed ( in " + rawFormula, counts: {}, normalized: normalized };
  return { valid: true, counts: stack[0], normalized: normalized };
}

function parseIonCharge(chargeStr) {
  if (!chargeStr || !chargeStr.trim()) return 0;
  var s = chargeStr.trim();
  if (s === "+") return 1;
  if (s === "-") return -1;
  var m = s.match(/^(\d+)?([+-])$/) || s.match(/^([+-])(\d+)?$/);
  if (!m) return 0;
  var mag = parseInt(m[1] || m[2] || "1", 10);
  var sign = s.indexOf("-") !== -1 ? -1 : 1;
  return mag * sign;
}

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b > 0) { var t = b; b = a % b; a = t; }
  return a || 1;
}

function validateAndBalanceChemEquation(reactants, products, autoBalance) {
  var allMols = reactants.concat(products);
  var elementSet = new Set();
  var parsedMols = [];

  for (var i = 0; i < allMols.length; i++) {
    var mol = allMols[i];
    var p = parseChemicalFormulaCounts(mol.formula);
    if (!p.valid) {
      return { valid: false, balanced: false, message: "⚠ " + p.error };
    }
    Object.keys(p.counts).forEach(function(el) { elementSet.add(el); });
    parsedMols.push({
      counts: p.counts,
      charge: mol.formula === "e" ? -1 : parseIonCharge(mol.charge),
      coeff: Math.max(1, parseInt(mol.coeff || "1", 10) || 1)
    });
  }

  var elements = Array.from(elementSet);
  var numReact = reactants.length;
  var numTotal = allMols.length;

  if (autoBalance && elements.length > 0 && numTotal >= 2) {
    var rows = elements.map(function(el) {
      return parsedMols.map(function(pm, idx) {
        var c = pm.counts[el] || 0;
        return idx < numReact ? c : -c;
      });
    });
    if (parsedMols.some(function(pm) { return pm.charge !== 0; })) {
      rows.push(parsedMols.map(function(pm, idx) {
        return idx < numReact ? pm.charge : -pm.charge;
      }));
    }

    var solvedCoeffs = solveStoichiometryNullspace(rows, numTotal);
    if (solvedCoeffs) {
      for (var k = 0; k < numTotal; k++) {
        parsedMols[k].coeff = solvedCoeffs[k];
        if (k < numReact) reactants[k].coeff = solvedCoeffs[k] === 1 ? "" : String(solvedCoeffs[k]);
        else products[k - numReact].coeff = solvedCoeffs[k] === 1 ? "" : String(solvedCoeffs[k]);
      }
    }
  }

  var diffs = [];
  var leftSummary = [];
  elements.forEach(function(el) {
    var lCount = 0;
    var rCount = 0;
    for (var r = 0; r < numReact; r++) lCount += (parsedMols[r].counts[el] || 0) * parsedMols[r].coeff;
    for (var pIdx = numReact; pIdx < numTotal; pIdx++) rCount += (parsedMols[pIdx].counts[el] || 0) * parsedMols[pIdx].coeff;
    if (lCount !== rCount) {
      diffs.push(el + " (L:" + lCount + " ≠ R:" + rCount + ")");
    } else {
      leftSummary.push(el + ":" + lCount);
    }
  });

  var lCharge = 0;
  var rCharge = 0;
  for (var rc = 0; rc < numReact; rc++) lCharge += parsedMols[rc].charge * parsedMols[rc].coeff;
  for (var pc = numReact; pc < numTotal; pc++) rCharge += parsedMols[pc].charge * parsedMols[pc].coeff;
  if (lCharge !== rCharge) {
    diffs.push("Charge (L:" + lCharge + " ≠ R:" + rCharge + ")");
  }

  if (diffs.length > 0) {
    return { valid: true, balanced: false, message: "⚠ Unbalanced: " + diffs.join(", ") };
  }

  return {
    valid: true,
    balanced: true,
    message: "✓ Balanced (" + leftSummary.join(", ") + (lCharge !== 0 ? ", Charge:" + lCharge : "") + ")"
  };
}

function solveStoichiometryNullspace(matrix, nCols) {
  var m = matrix.map(function(r) { return r.slice(); });
  var nRows = m.length;
  var pivotCol = 0;
  var pivotCols = [];

  for (var r = 0; r < nRows && pivotCol < nCols - 1; r++) {
    var sel = r;
    while (sel < nRows && Math.abs(m[sel][pivotCol]) < 1e-9) sel++;
    if (sel === nRows) { pivotCol++; r--; continue; }
    var tmp = m[r]; m[r] = m[sel]; m[sel] = tmp;
    pivotCols.push({ row: r, col: pivotCol });
    var pivVal = m[r][pivotCol];
    for (var c = pivotCol; c < nCols; c++) m[r][c] /= pivVal;
    for (var r2 = 0; r2 < nRows; r2++) {
      if (r2 !== r && Math.abs(m[r2][pivotCol]) > 1e-9) {
        var fac = m[r2][pivotCol];
        for (var c2 = pivotCol; c2 < nCols; c2++) m[r2][c2] -= fac * m[r][c2];
      }
    }
    pivotCol++;
  }

  var sol = new Array(nCols).fill(1);
  for (var i = pivotCols.length - 1; i >= 0; i--) {
    var pr = pivotCols[i].row;
    var pc = pivotCols[i].col;
    var sum = 0;
    for (var j = pc + 1; j < nCols; j++) sum += m[pr][j] * sol[j];
    sol[pc] = -sum;
  }

  // If all components are non-positive, flip signs to find positive integer multipliers
  if (sol.every(function(v) { return v <= 1e-9; })) {
    sol = sol.map(function(v) { return -v; });
  }

  for (var mult = 1; mult <= 120; mult++) {
    var scaled = sol.map(function(v) { return Math.round(v * mult); });
    var ok = scaled.every(function(v, idx) {
      return v > 0 && Math.abs(v - sol[idx] * mult) < 1e-4;
    });
    if (ok) {
      var g = scaled.reduce(gcd);
      return scaled.map(function(v) { return v / g; });
    }
  }
  return null;
}

// ============================================================================
// 5. BALANCED-BRACE SLOT ENGINE & LIVE CURSOR HIGHLIGHTER FOR ANY EQUATION
// ============================================================================

function scanBalancedSlotTokens(str) {
  var tokens = [];
  if (!str) return tokens;
  var i = 0;
  var len = str.length;

  while (i < len - 2) {
    if (str[i] === "$" && str[i + 1] === "{") {
      var start = i;
      var j = i + 2;
      var idStr = "";
      while (j < len && /[0-9]/.test(str[j])) { idStr += str[j]; j++; }
      if (idStr.length > 0 && j < len && (str[j] === ":" || str[j] === "}")) {
        var defVal = "";
        if (str[j] === ":") {
          j++;
          var depth = 1;
          var valStart = j;
          while (j < len && depth > 0) {
            if (str[j] === "{" && str[j - 1] !== "\\") depth++;
            else if (str[j] === "}" && str[j - 1] !== "\\") depth--;
            if (depth > 0) j++;
          }
          if (depth === 0) {
            defVal = str.slice(valStart, j);
            tokens.push({ start: start, end: j + 1, id: idStr, defaultVal: defVal });
            i = j + 1;
            continue;
          }
        } else if (str[j] === "}") {
          tokens.push({ start: start, end: j + 1, id: idStr, defaultVal: "" });
          i = j + 1;
          continue;
        }
      }
    }
    i++;
  }
  return tokens;
}

function classifySlotRole(template, tokenStart, defaultLabel) {
  var before = template.slice(Math.max(0, tokenStart - 22), tokenStart);
  if (/\\begin\{[bpvBV]?matrix\}/.test(template) && !/\\frac|\\int/.test(before)) return "Matrix Cell";
  if (/_\s*\{?\s*$/.test(before)) {
    if (/\\int|\\sum|\\prod|\\lim/.test(before)) return "Lower Bound";
    return "Subscript (_)";
  }
  if (/\^\s*\{?\s*$/.test(before)) {
    if (/\\int|\\sum|\\prod/.test(before)) return "Upper Bound";
    return "Superscript (^)";
  }
  if (/\\frac\s*\{\s*$/.test(before)) return "Numerator";
  if (/\}\s*\{\s*$/.test(before)) return "Denominator";
  if (/\\sqrt\s*\[\s*$/.test(before)) return "Root Index";
  if (/\\sqrt\s*\{\s*$/.test(before)) return "Radicand";
  if (/\\mathrm\s*\{\s*$/.test(before)) return "Chemical";
  if (defaultLabel && (/f\(x\)|g\(x\)|y/.test(defaultLabel))) return "Function";
  return "Expression";
}

function extractTemplateSlots(template, autoDetectBraces) {
  if (!template) return { template: "", slots: [] };
  var tokens = scanBalancedSlotTokens(template);
  var slotsById = {};
  var order = [];

  if (tokens.length > 0) {
    tokens.forEach(function(tk) {
      if (!slotsById[tk.id]) {
        var role = classifySlotRole(template, tk.start, tk.defaultVal);
        slotsById[tk.id] = {
          id: tk.id,
          label: tk.defaultVal || ("val_" + tk.id),
          value: tk.defaultVal,
          role: role
        };
        order.push(slotsById[tk.id]);
      }
    });
    order.sort(function(a, b) { return Number(a.id) - Number(b.id); });
    return { template: template, slots: order };
  }

  if (!autoDetectBraces) return { template: template, slots: [] };

  var matMatch = template.match(/^([\s\S]*?\\begin\{([bpvBV]?matrix)\})([\s\S]*?)(\\end\{\2\}[\s\S]*)$/);
  if (matMatch) {
    var prefix = matMatch[1];
    var body = matMatch[3];
    var suffix = matMatch[4];
    var cellCounter = 0;
    var rows = body.trim().split(/\\\\/);
    var newRows = rows.map(function(rowStr) {
      var cells = rowStr.split("&");
      return cells.map(function(cell) {
        var cTrim = cell.trim();
        if (!cTrim) return cell;
        cellCounter++;
        var cid = String(cellCounter);
        slotsById[cid] = { id: cid, label: "Cell " + cid, value: cTrim, role: "Matrix Cell" };
        order.push(slotsById[cid]);
        return " ${" + cid + ":" + cTrim + "} ";
      }).join("&");
    });
    return { template: prefix + "\n" + newRows.join(" \\\\\n") + "\n" + suffix, slots: order };
  }

  var counter = 0;
  var converted = template.replace(/(\\[a-zA-Z]+)?\{([^{}]+)\}/g, function(full, cmd, inner) {
    var trimmed = inner.trim();
    if (!trimmed) return full;
    if (cmd === "\\begin" || cmd === "\\end" || cmd === "\\text" || cmd === "\\operatorname") return full;
    counter++;
    var sid = String(counter);
    var prefixCmd = cmd || "";
    var role = prefixCmd === "\\frac" ? "Numerator" : (prefixCmd === "\\sqrt" ? "Radicand" : "Expression");
    slotsById[sid] = { id: sid, label: trimmed, value: trimmed, role: role };
    order.push(slotsById[sid]);
    return prefixCmd + "{${" + sid + ":" + trimmed + "}}";
  });

  if (order.length === 0 && template.indexOf("=") !== -1) {
    var eqSides = template.split("=");
    if (eqSides.length === 2) {
      var lhs = eqSides[0].trim();
      var rhs = eqSides[1].trim();
      slotsById["1"] = { id: "1", label: lhs, value: lhs, role: "LHS" };
      slotsById["2"] = { id: "2", label: rhs, value: rhs, role: "RHS" };
      order.push(slotsById["1"], slotsById["2"]);
      return { template: "${1:" + lhs + "} = ${2:" + rhs + "}", slots: order };
    }
  }

  return { template: converted, slots: order };
}

function validateSlotValue(val) {
  if (val === null || val === undefined || String(val).trim() === "") {
    return { valid: false, reason: "Empty field" };
  }
  var s = String(val);
  var depth = 0;
  for (var i = 0; i < s.length; i++) {
    if (s[i] === "{" && (i === 0 || s[i - 1] !== "\\")) depth++;
    else if (s[i] === "}" && (i === 0 || s[i - 1] !== "\\")) depth--;
    if (depth < 0) return { valid: false, reason: "Extra } brace" };
  }
  if (depth !== 0) return { valid: false, reason: "Unclosed { brace" };
  return { valid: true, reason: "Valid" };
}

function compileTemplateWithSlots(template, slots, highlightSlotId) {
  if (!template) return "";
  var map = {};
  (slots || []).forEach(function(s) {
    map[s.id] = s.value !== undefined && s.value !== "" ? s.value : s.label;
  });

  var tokens = scanBalancedSlotTokens(template);
  if (tokens.length === 0) return template;

  var out = "";
  var lastIdx = 0;
  tokens.forEach(function(tk) {
    out += template.slice(lastIdx, tk.start);
    var val = map[tk.id] !== undefined ? map[tk.id] : (tk.defaultVal || "\\square");
    if (highlightSlotId && String(highlightSlotId) === String(tk.id)) {
      var beforeChar = template.slice(Math.max(0, tk.start - 3), tk.start);
      if (/[\^_]\s*\{?$/.test(beforeChar)) {
        out += "{\\bbox[3px, #fef08a, border: 2px solid #7c3aed]{\\color{#4c1d95}\\mathbf{" + val + "}}}";
      } else {
        out += "\\bbox[5px, #fef08a, border: 2px solid #7c3aed]{\\color{#4c1d95}\\mathbf{" + val + "}}";
      }
    } else {
      out += val;
    }
    lastIdx = tk.end;
  });
  out += template.slice(lastIdx);
  return out;
}

function highlightRawLatexAtCursor(rawLatex, cursorOffset) {
  if (!rawLatex || cursorOffset === undefined || cursorOffset === null) return rawLatex;
  var openIdx = -1;
  var depth = 0;
  for (var i = cursorOffset - 1; i >= 0; i--) {
    if (rawLatex[i] === "}" && rawLatex[i - 1] !== "\\") depth++;
    else if (rawLatex[i] === "{" && rawLatex[i - 1] !== "\\") {
      if (depth === 0) { openIdx = i; break; }
      depth--;
    }
  }
  if (openIdx === -1) return rawLatex;

  var beforeCmd = rawLatex.slice(Math.max(0, openIdx - 8), openIdx);
  if (/\\(begin|end|text|mathrm)$/.test(beforeCmd)) return rawLatex;

  var closeIdx = -1;
  depth = 1;
  for (var j = openIdx + 1; j < rawLatex.length; j++) {
    if (rawLatex[j] === "{" && rawLatex[j - 1] !== "\\") depth++;
    else if (rawLatex[j] === "}" && rawLatex[j - 1] !== "\\") {
      depth--;
      if (depth === 0) { closeIdx = j; break; }
    }
  }
  if (closeIdx === -1) return rawLatex;
  var inner = rawLatex.slice(openIdx + 1, closeIdx);
  if (!inner.trim()) return rawLatex;

  return rawLatex.slice(0, openIdx + 1) +
    "{\\bbox[4px, #fef08a, border: 2px solid #7c3aed]{\\color{#4c1d95}\\mathbf{" + inner + "}}}" +
    rawLatex.slice(closeIdx);
}

function parseSnippetTabstops(template) {
  var tokens = scanBalancedSlotTokens(template);
  if (tokens.length === 0) {
    return { text: template || "", selectionStart: (template || "").length, selectionEnd: (template || "").length };
  }
  var text = "";
  var lastIndex = 0;
  var firstStart = -1;
  var firstEnd = -1;

  tokens.forEach(function(tk) {
    text += template.slice(lastIndex, tk.start);
    var placeholder = tk.defaultVal || "";
    var start = text.length;
    text += placeholder;
    var end = text.length;
    if (tk.id === "1" && firstStart < 0) {
      firstStart = start;
      firstEnd = end;
    }
    lastIndex = tk.end;
  });
  text += template.slice(lastIndex);

  if (firstStart < 0) {
    firstStart = text.length;
    firstEnd = text.length;
  }
  return { text: text, selectionStart: firstStart, selectionEnd: firstEnd };
}

function wrapMath(latex, style) {
  var t = latex ? latex.trim() : "";
  if (!t) return "";
  if (t.startsWith("$$") && t.endsWith("$$")) return t;
  if (t.startsWith("$") && t.endsWith("$")) return t;
  return style === "inline" ? "$" + t + "$" : "$$\n" + t + "\n$$";
}

function normalizeDelimiters(content, wrapStyle) {
  if (!content) return "";
  var result = "";
  var i = 0;
  while (i < content.length) {
    if (content.indexOf("```", i) === i) {
      var end = content.indexOf("```", i + 3);
      if (end === -1) { result += content.slice(i); break; }
      result += content.slice(i, end + 3);
      i = end + 3;
      continue;
    }
    if (content.charAt(i) === "`") {
      var endCode = content.indexOf("`", i + 1);
      if (endCode === -1) { result += content.slice(i); break; }
      result += content.slice(i, endCode + 1);
      i = endCode + 1;
      continue;
    }
    if (content.indexOf("\\[", i) === i) {
      var endBlock = content.indexOf("\\]", i + 2);
      if (endBlock !== -1) {
        result += "$$\n" + content.slice(i + 2, endBlock).trim() + "\n$$";
        i = endBlock + 2;
        continue;
      }
    }
    if (content.indexOf("\\(", i) === i) {
      var endInline = content.indexOf("\\)", i + 2);
      if (endInline !== -1) {
        var delim = wrapStyle === "inline" ? "$" : "$$";
        result += delim + content.slice(i + 2, endInline).trim() + delim;
        i = endInline + 2;
        continue;
      }
    }
    result += content.charAt(i);
    i++;
  }
  return result;
}

function itemMatchesQuery(item, q) {
  if (!q) return true;
  if (item._searchTokens) {
    return item._searchTokens.indexOf(q) !== -1;
  }
  if (item.trigger && item.trigger.toLowerCase().indexOf(q) !== -1) return true;
  if (Array.isArray(item.aliases)) {
    for (var i = 0; i < item.aliases.length; i++) {
      if (item.aliases[i].toLowerCase().indexOf(q) !== -1) return true;
    }
  }
  if (item.name && item.name.toLowerCase().indexOf(q) !== -1) return true;
  if (item.topic && item.topic.toLowerCase().indexOf(q) !== -1) return true;
  if (item.subtopic && item.subtopic.toLowerCase().indexOf(q) !== -1) return true;
  if (item.description && item.description.toLowerCase().indexOf(q) !== -1) return true;
  if (item.wolfram && item.wolfram.toLowerCase().indexOf(q) !== -1) return true;
  if (item.matlab && item.matlab.toLowerCase().indexOf(q) !== -1) return true;
  if (item.latex && item.latex.toLowerCase().indexOf(q) !== -1) return true;
  if (item.replacement && item.replacement.toLowerCase().indexOf(q) !== -1) return true;
  return false;
}

// ============================================================================
// 6. SMART INPUT HELPER: AUTO-CLOSE _{} / ^{} & FLOATING AUTOCOMPLETE
// ============================================================================
function attachSmartMathInputBehaviors(comp, inputEl, plugin, onValueChange) {
  var popup = null;
  var matches = [];
  var selIdx = 0;
  var queryRange = null;

  var closePopup = function() {
    if (popup && popup.parentNode) popup.parentNode.removeChild(popup);
    popup = null;
    matches = [];
  };

  var applyMatch = function(item) {
    if (!queryRange) return;
    var val = inputEl.value;
    var itemCode = item.latex || item.replacement || "";
    var cleanLatex = compileTemplateWithSlots(itemCode, extractTemplateSlots(itemCode, false).slots, null);
    var nextVal = val.slice(0, queryRange.start) + cleanLatex + val.slice(queryRange.end);
    inputEl.value = nextVal;
    var newCursor = queryRange.start + cleanLatex.length;
    inputEl.setSelectionRange(newCursor, newCursor);
    closePopup();
    if (onValueChange) onValueChange(nextVal);
  };

  var renderPopup = function() {
    if (!popup) popup = document.body.createDiv("lt-universal-ac-popup");
    popup.empty();
    var rect = inputEl.getBoundingClientRect();
    var popupHeight = 180;
    var popupWidth = Math.max(260, rect.width);
    var top = (rect.bottom + popupHeight > window.innerHeight)
      ? Math.max(8, rect.top - popupHeight - 4)
      : rect.bottom + 4;
    var left = Math.max(8, Math.min(rect.left, window.innerWidth - popupWidth - 12));
    popup.style.left = left + "px";
    popup.style.top = top + "px";
    popup.style.minWidth = popupWidth + "px";

    matches.forEach(function(item, idx) {
      var row = popup.createDiv("lt-ac-row" + (idx === selIdx ? " is-selected" : ""));
      row.createSpan({ text: (item.name || item.trigger) + " (" + item.trigger + ")", cls: "lt-ac-name" });
      row.createEl("code", { text: (item.latex || item.replacement || "").slice(0, 32), cls: "lt-ac-code" });
      comp.registerDomEvent(row, "mousedown", function(e) {
        e.preventDefault();
        e.stopPropagation();
        applyMatch(item);
      });
    });
  };

  comp.registerDomEvent(inputEl, "keydown", function(e) {
    if ((e.key === "_" || e.key === "^") && !e.ctrlKey && !e.metaKey) {
      var start = inputEl.selectionStart;
      var end = inputEl.selectionEnd;
      var val = inputEl.value;
      if (val[end] !== "{") {
        e.preventDefault();
        var selectedText = val.slice(start, end);
        var inserted = e.key + "{" + selectedText + "}";
        inputEl.value = val.slice(0, start) + inserted + val.slice(end);
        var cursorPos = start + 2 + selectedText.length;
        inputEl.setSelectionRange(cursorPos, cursorPos);
        if (onValueChange) onValueChange(inputEl.value);
        return;
      }
    }

    if (e.key === "{" && !e.ctrlKey && !e.metaKey) {
      var sPos = inputEl.selectionStart;
      var ePos = inputEl.selectionEnd;
      var vStr = inputEl.value;
      e.preventDefault();
      var selStr = vStr.slice(sPos, ePos);
      inputEl.value = vStr.slice(0, sPos) + "{" + selStr + "}" + vStr.slice(ePos);
      inputEl.setSelectionRange(sPos + 1 + selStr.length, sPos + 1 + selStr.length);
      if (onValueChange) onValueChange(inputEl.value);
      return;
    }

    if (popup && matches.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault(); e.stopPropagation();
        selIdx = (selIdx + 1) % matches.length;
        renderPopup();
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault(); e.stopPropagation();
        selIdx = (selIdx - 1 + matches.length) % matches.length;
        renderPopup();
        return;
      }
      if (e.key === "Tab" || (e.key === "Enter" && matches.length > 0)) {
        e.preventDefault(); e.stopPropagation();
        applyMatch(matches[selIdx]);
        return;
      }
      if (e.key === "Escape") {
        closePopup();
        return;
      }
    }
  });

  comp.registerDomEvent(inputEl, "input", function() {
    var val = inputEl.value;
    var cur = inputEl.selectionStart;
    var before = val.slice(0, cur);
    var m = before.match(/(?:^|[\s({[+-])([a-zA-Z0-9/_+\-=]{2,24})$/);
    if (!m) { closePopup(); return; }
    var q = m[1].toLowerCase();
    queryRange = { start: cur - m[1].length, end: cur };
    matches = plugin.fastSearchFormulas ? plugin.fastSearchFormulas(q, 6) : [];
    if (matches.length === 0 && !plugin.fastSearchFormulas) {
      var all = [].concat(
        plugin.settings.customShortcuts || [],
        plugin.settings.customSnippets || []
      ).filter(function(x) {
        return x.enabled !== false && itemMatchesQuery(x, q);
      });
      matches = all.slice(0, 6);
    }
    selIdx = 0;
    if (matches.length === 0) closePopup();
    else renderPopup();
  });

  comp.registerDomEvent(inputEl, "blur", function() {
    window.setTimeout(closePopup, 150);
  });
}

// ============================================================================
// 7. FLOATING STEP-BY-STEP SOLVER WINDOW
// ============================================================================
class FloatingSolverWindow {
  constructor(app, plugin, builderRef) {
    this.app = app;
    this.plugin = plugin;
    this.builderRef = builderRef || null;
    this.comp = new obsidian.Component();
    this.renderComp = new obsidian.Component();
    this.previewTimer = null;
    this.steps = [
      { rel: "\\text{Given:}", expr: "y = f(x)", note: "Initial equation" },
      { rel: "\\implies", expr: "\\frac{dy}{dx} = f'(x)", note: "Differentiate both sides" }
    ];
    this.containerEl = null;
  }

  scheduleUpdatePreview() {
    if (this.previewTimer) window.clearTimeout(this.previewTimer);
    var self = this;
    this.previewTimer = window.setTimeout(function() {
      self.previewTimer = null;
      self.updatePreview();
    }, 75);
  }

  open(initialPresetId) {
    if (this.containerEl && document.body.contains(this.containerEl)) return;
    this.comp.load();
    this.renderComp.load();

    if (initialPresetId) {
      var found = SOLVER_PRESETS.find(function(p) { return p.id === initialPresetId; });
      if (found) this.steps = JSON.parse(JSON.stringify(found.steps));
    }

    var win = document.body.createDiv("lt-floating-solver-window");
    this.containerEl = win;

    var self = this;
    ["mousedown", "mouseup", "click", "keydown", "keyup", "keypress", "focusin"].forEach(function(evtName) {
      self.comp.registerDomEvent(win, evtName, function(e) { e.stopPropagation(); });
    });

    var titleBar = win.createDiv("lt-floating-titlebar");
    var titleLeft = titleBar.createDiv("lt-floating-title-left");
    titleLeft.createSpan({ text: "∑ Step-by-Step Math, Physics & Engineering Solver", cls: "lt-floating-title" });
    titleLeft.createSpan({ text: "(Drag header · Resize corner · Supports Wolfram Natural Math & Auto _{})", cls: "lt-floating-hint" });

    var closeBtn = titleBar.createEl("button", { text: "✕", cls: "lt-floating-close" });
    closeBtn.type = "button";
    this.comp.registerDomEvent(closeBtn, "click", function() { self.close(); });

    var isDragging = false;
    var dragOffsetX = 0;
    var dragOffsetY = 0;
    this.comp.registerDomEvent(titleBar, "mousedown", function(e) {
      if (e.target === closeBtn) return;
      isDragging = true;
      var rect = win.getBoundingClientRect();
      dragOffsetX = e.clientX - rect.left;
      dragOffsetY = e.clientY - rect.top;
      win.style.transform = "none";
      win.style.left = rect.left + "px";
      win.style.top = rect.top + "px";
    });
    this.comp.registerDomEvent(window, "mousemove", function(e) {
      if (!isDragging) return;
      var nx = Math.max(8, Math.min(window.innerWidth - 120, e.clientX - dragOffsetX));
      var ny = Math.max(8, Math.min(window.innerHeight - 80, e.clientY - dragOffsetY));
      win.style.left = nx + "px";
      win.style.top = ny + "px";
    });
    this.comp.registerDomEvent(window, "mouseup", function() { isDragging = false; });

    var body = win.createDiv("lt-floating-body");

    var topControls = body.createDiv("lt-solver-toolbar");
    topControls.createSpan({ text: "✨ Template:", cls: "lt-section-label" });
    var presetSelect = topControls.createEl("select", { cls: "dropdown lt-compact-dropdown" });
    presetSelect.createEl("option", { value: "", text: "-- Load Step-by-Step Example --" });
    SOLVER_PRESETS.forEach(function(p) {
      presetSelect.createEl("option", { value: p.id, text: p.name });
    });
    this.comp.registerDomEvent(presetSelect, "change", function() {
      var p = SOLVER_PRESETS.find(function(x) { return x.id === presetSelect.value; });
      if (p) {
        self.steps = JSON.parse(JSON.stringify(p.steps));
        self.renderSteps();
      }
    });

    var addStepBtn = topControls.createEl("button", { text: "+ Add Step", cls: "mod-cta lt-compact-btn" });
    addStepBtn.type = "button";
    this.comp.registerDomEvent(addStepBtn, "click", function() {
      self.steps.push({ rel: "=", expr: "", note: "" });
      self.renderSteps(self.steps.length - 1);
    });

    var pullBtn = topControls.createEl("button", { text: "⬅ Pull Formula from Builder", cls: "lt-compact-btn" });
    pullBtn.type = "button";
    this.comp.registerDomEvent(pullBtn, "click", function() {
      var activeBuilder = self.builderRef || self.plugin.activeBuilderModal;
      var builderLatex = (activeBuilder && activeBuilder.inputEl) ? activeBuilder.inputEl.value.trim() : "";
      if (builderLatex) {
        self.steps.push({ rel: "=", expr: builderLatex, note: "From Interactive Builder" });
        self.renderSteps(self.steps.length - 1);
      } else {
        new obsidian.Notice("No formula currently in the Interactive Builder.");
      }
    });

    var aiToolbar = body.createDiv("lt-solver-toolbar");
    aiToolbar.createSpan({ text: "🌐 Instant Solvers:", cls: "lt-section-label" });

    var wolframBtn = aiToolbar.createEl("button", { text: "🌐 WolframAlpha", cls: "lt-compact-btn" });
    wolframBtn.type = "button";
    wolframBtn.title = "Open formula in WolframAlpha for symbolic computation and step-by-step solution";
    this.comp.registerDomEvent(wolframBtn, "click", function() {
      var ltx = self.compileAlignedLatex();
      var clean = ltx.replace(/\\begin\{aligned\}|\\end\{aligned\}|&|\\text\{[^}]*\}|\\\\/g, " ").trim();
      window.open("https://www.wolframalpha.com/input?i=" + encodeURIComponent(clean || "solve"));
    });

    var aiSelect = aiToolbar.createEl("select", { cls: "dropdown lt-compact-dropdown" });
    aiSelect.createEl("option", { value: "", text: "🤖 Ask AI Step-by-Step..." });
    aiSelect.createEl("option", { value: "deepseek", text: "DeepSeek (Free & Math-Specialized)" });
    aiSelect.createEl("option", { value: "chatgpt", text: "ChatGPT" });
    aiSelect.createEl("option", { value: "claude", text: "Claude" });
    aiSelect.createEl("option", { value: "gemini", text: "Gemini" });

    this.comp.registerDomEvent(aiSelect, "change", function() {
      var service = aiSelect.value;
      if (!service) return;
      var ltx = self.compileAlignedLatex();
      var prompt = "Please provide a rigorous, clear, step-by-step mathematical derivation and solution for the following:\n\n$$\n" + ltx + "\n$$\n\nExplain each step clearly with underlying theorems and formulas.";
      navigator.clipboard.writeText(prompt).then(function() {
        new obsidian.Notice("Copied step-by-step prompt to clipboard!");
      });
      if (service === "deepseek") window.open("https://chat.deepseek.com/");
      else if (service === "chatgpt") window.open("https://chatgpt.com/?q=" + encodeURIComponent("Solve step-by-step with clear derivation:\n" + ltx));
      else if (service === "claude") window.open("https://claude.ai/new");
      else if (service === "gemini") window.open("https://gemini.google.com/app");
      aiSelect.value = "";
    });

    var casBtn = aiToolbar.createEl("button", { text: "⚙️ Local CAS", cls: "lt-compact-btn" });
    casBtn.type = "button";
    casBtn.title = "Execute derivation with connected CAS Provider (or view connection guide)";
    this.comp.registerDomEvent(casBtn, "click", async function() {
      var activeProvider = self.plugin.api.getActiveCASProvider();
      var ltx = self.compileAlignedLatex();
      if (activeProvider) {
        new obsidian.Notice("Computing with " + (activeProvider.name || activeProvider.id) + "...");
        var res = await self.plugin.api.solveWithCAS(ltx);
        if (res.success && Array.isArray(res.steps) && res.steps.length > 0) {
          self.steps = res.steps;
          self.renderSteps();
          new obsidian.Notice("Loaded " + res.steps.length + " steps from CAS!");
        } else if (res.success && res.resultLatex) {
          self.steps.push({ rel: "=", expr: res.resultLatex, note: "Computed via " + (activeProvider.name || activeProvider.id) });
          self.renderSteps(self.steps.length - 1);
        } else {
          new obsidian.Notice("CAS Error: " + (res.error || "No solution returned."));
        }
      } else {
        new obsidian.Notice("No local CAS plugin registered yet. Plugins can connect via window.LatexToolboxAPI.registerCASProvider().");
      }
    });

    this.stepsListEl = body.createDiv("lt-solver-steps-list");
    this.previewBox = body.createDiv("lt-preview lt-solver-preview");

    var footer = body.createDiv("lt-footer");
    var sendToBuilderBtn = footer.createEl("button", { text: "Send Aligned Steps to Builder" });
    sendToBuilderBtn.type = "button";
    this.comp.registerDomEvent(sendToBuilderBtn, "click", function() {
      var activeBuilder = self.builderRef || self.plugin.activeBuilderModal;
      var compiled = self.compileAlignedLatex();
      if (activeBuilder && activeBuilder.inputEl) {
        activeBuilder.loadTemplateIntoSlots(compiled, false);
        new obsidian.Notice("Sent aligned solution to Interactive Builder!");
      } else {
        self.plugin.api.openBuilder(compiled);
      }
    });

    var copyBtn = footer.createEl("button", { text: "Copy Aligned LaTeX" });
    copyBtn.type = "button";
    this.comp.registerDomEvent(copyBtn, "click", function() {
      navigator.clipboard.writeText(self.compileAlignedLatex()).then(function() {
        new obsidian.Notice("Step-by-step LaTeX copied!");
      });
    });

    var insertBtn = footer.createEl("button", { text: "Insert Full Solution into Note", cls: "mod-cta" });
    insertBtn.type = "button";
    this.comp.registerDomEvent(insertBtn, "click", function() {
      var activeBuilder = self.builderRef || self.plugin.activeBuilderModal;
      var view = self.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
      var editor = (activeBuilder && activeBuilder.editor) ? activeBuilder.editor : (view ? view.editor : null);
      var ltx = wrapMath(self.compileAlignedLatex(), "block");
      if (editor) {
        editor.replaceSelection(ltx);
        new obsidian.Notice("Inserted step-by-step solution into note.");
      } else {
        navigator.clipboard.writeText(ltx);
        new obsidian.Notice("Copied full solution to clipboard.");
      }
    });

    this.renderSteps(0);
  }

  compileAlignedLatex() {
    var lines = this.steps.map(function(st) {
      var r = (st.rel || "=").trim();
      var e = (st.expr || "\\square").trim();
      var n = (st.note || "").trim();
      var noteLatex = n ? " && \\text{(" + n + ")}" : "";
      return "  " + r + " & " + e + noteLatex;
    });
    return "\\begin{aligned}\n" + lines.join(" \\\\\n") + "\n\\end{aligned}";
  }

  renderSteps(focusStepIdx) {
    var self = this;
    this.stepsListEl.empty();
    var exprInputs = [];

    var relations = [
      { val: "=", label: "= (Equals)" },
      { val: "\\implies", label: "⟹ (Implies)" },
      { val: "\\iff", label: "⟺ (Iff)" },
      { val: "\\approx", label: "≈ (Approx)" },
      { val: "\\text{Given:}", label: "Given:" },
      { val: "\\text{LHS} =", label: "LHS =" },
      { val: "\\text{Substitute:}", label: "Substitute:" },
      { val: "\\therefore", label: "∴ (Therefore)" }
    ];

    this.steps.forEach(function(step, idx) {
      var row = self.stepsListEl.createDiv("lt-solver-step-row");
      row.createSpan({ text: "Step " + (idx + 1), cls: "lt-solver-step-num" });

      var relSel = row.createEl("select", { cls: "dropdown lt-solver-rel" });
      var matchedRel = false;
      relations.forEach(function(r) {
        var opt = relSel.createEl("option", { value: r.val, text: r.label });
        if (r.val === step.rel) { opt.selected = true; matchedRel = true; }
      });
      if (!matchedRel && step.rel) {
        var customOpt = relSel.createEl("option", { value: step.rel, text: step.rel });
        customOpt.selected = true;
      }

      var exprInput = row.createEl("input", {
        cls: "lt-slot-input lt-solver-expr",
        attr: { type: "text", value: step.expr, placeholder: "Type LaTeX or natural math (e.g. (x^2+1)/(x-1))..." }
      });
      exprInputs.push(exprInput);

      var natBtn = row.createEl("button", {
        text: "⚡→LaTeX",
        cls: "lt-step-nat-btn",
        attr: { title: "Convert Wolfram/Maple Natural Math in this step into LaTeX" }
      });
      natBtn.type = "button";

      var noteInput = row.createEl("input", {
        cls: "lt-slot-input lt-solver-note",
        attr: { type: "text", value: step.note || "", placeholder: "Reasoning / note..." }
      });

      var delBtn = row.createEl("button", { text: "✕", cls: "lt-step-del-btn" });
      delBtn.type = "button";

      attachSmartMathInputBehaviors(self.comp, exprInput, self.plugin, function(val) {
        step.expr = val;
        self.scheduleUpdatePreview();
      });

      self.comp.registerDomEvent(relSel, "change", function() { step.rel = relSel.value; self.updatePreview(); });
      self.comp.registerDomEvent(exprInput, "input", function() { step.expr = exprInput.value; self.scheduleUpdatePreview(); });
      self.comp.registerDomEvent(natBtn, "click", function() {
        exprInput.value = wolframNaturalToLatex(exprInput.value);
        step.expr = exprInput.value;
        self.updatePreview();
      });
      self.comp.registerDomEvent(noteInput, "input", function() { step.note = noteInput.value; self.scheduleUpdatePreview(); });
      self.comp.registerDomEvent(delBtn, "click", function() {
        if (self.steps.length <= 1) return;
        self.steps.splice(idx, 1);
        self.renderSteps(Math.max(0, idx - 1));
      });
    });

    this.updatePreview();
    if (focusStepIdx !== undefined && exprInputs[focusStepIdx]) {
      window.setTimeout(function() { exprInputs[focusStepIdx].focus(); }, 20);
    }
  }

  async updatePreview() {
    this.renderComp.unload();
    this.renderComp = new obsidian.Component();
    this.renderComp.load();
    this.previewBox.empty();
    var ltx = this.compileAlignedLatex();
    try {
      await obsidian.MarkdownRenderer.render(this.app, wrapMath(ltx, "block"), this.previewBox, "", this.renderComp);
    } catch (e) {
      this.previewBox.createEl("code", { text: ltx });
    }
  }

  close() {
    if (this.previewTimer) {
      window.clearTimeout(this.previewTimer);
      this.previewTimer = null;
    }
    this.comp.unload();
    this.renderComp.unload();
    if (this.containerEl && this.containerEl.parentNode) {
      this.containerEl.parentNode.removeChild(this.containerEl);
    }
    this.containerEl = null;
  }
}

// ============================================================================
// 8. IN-NOTE FLOATING SLOT POP-UP
// ============================================================================
class InNoteSlotPopupModal extends obsidian.Modal {
  constructor(app, plugin, editor, item, replaceRange) {
    super(app);
    this.plugin = plugin;
    this.editor = editor;
    this.item = item;
    this.replaceRange = replaceRange;
    var extracted = extractTemplateSlots(item.latex, true);
    this.template = extracted.template;
    this.slots = extracted.slots;
    this.activeSlotId = this.slots.length > 0 ? this.slots[0].id : null;
    this.comp = new obsidian.Component();
    this.renderComp = new obsidian.Component();
  }

  onOpen() {
    this.comp.load();
    this.renderComp.load();
    this.modalEl.addClass("lt-innote-slot-modal");
    var contentEl = this.contentEl;
    contentEl.empty();

    var header = contentEl.createDiv("lt-innote-header");
    header.createDiv({ text: this.item.name || this.item.trigger, cls: "lt-innote-title" });
    header.createDiv({
      text: "Enter / Arrow Keys switch fields · '_' and '^' auto-close _{} and ^{} · Triggers autocomplete.",
      cls: "lt-subtitle"
    });

    this.slotBar = contentEl.createDiv("lt-slot-pill-grid");
    this.previewBox = contentEl.createDiv("lt-preview lt-innote-preview");

    var self = this;
    this.slotInputs = [];

    this.slots.forEach(function(slot, idx) {
      var pill = self.slotBar.createDiv("lt-slot-pill");
      var topRow = pill.createDiv("lt-slot-pill-top");
      topRow.createSpan({ text: "#" + slot.id + " · " + (slot.role || "Expr"), cls: "lt-slot-label" });
      var statusBadge = topRow.createSpan({ text: "✓ Valid", cls: "lt-slot-status is-valid" });

      var input = pill.createEl("input", {
        cls: "lt-slot-input",
        attr: { type: "text", value: slot.value, placeholder: slot.label }
      });
      self.slotInputs.push({ input: input, slot: slot, pill: pill, badge: statusBadge });

      var updateStatus = function() {
        var check = validateSlotValue(slot.value);
        statusBadge.setText(check.valid ? "✓ Valid" : "⚠ " + check.reason);
        statusBadge.toggleClass("is-valid", check.valid);
        statusBadge.toggleClass("is-invalid", !check.valid);
        pill.toggleClass("is-invalid", !check.valid);
      };
      updateStatus();

      attachSmartMathInputBehaviors(self.comp, input, self.plugin, function(newVal) {
        slot.value = newVal;
        updateStatus();
        self.updatePreview();
      });

      self.comp.registerDomEvent(input, "focus", function() {
        self.activeSlotId = slot.id;
        self.slotInputs.forEach(function(s) { s.pill.toggleClass("is-active", s.slot.id === slot.id); });
        input.select();
        self.updatePreview();
      });

      self.comp.registerDomEvent(pill, "mouseenter", function() {
        self.activeSlotId = slot.id;
        self.updatePreview();
      });

      self.comp.registerDomEvent(input, "input", function() {
        slot.value = input.value;
        updateStatus();
        self.updatePreview();
      });

      self.comp.registerDomEvent(input, "keydown", function(e) {
        if (e.key === "Enter" || (e.key === "ArrowRight" && input.selectionEnd === input.value.length)) {
          e.preventDefault();
          if (idx + 1 < self.slotInputs.length) {
            self.slotInputs[idx + 1].input.focus();
          } else if (e.key === "Enter") {
            self.commitToEditor();
          }
        } else if (e.key === "ArrowLeft" && input.selectionStart === 0) {
          e.preventDefault();
          if (idx - 1 >= 0) {
            self.slotInputs[idx - 1].input.focus();
          }
        }
      });
    });

    var footer = contentEl.createDiv("lt-footer");
    var openFullBtn = footer.createEl("button", { text: "Open in Full STEM Builder" });
    openFullBtn.type = "button";
    this.comp.registerDomEvent(openFullBtn, "click", function() {
      var compiled = compileTemplateWithSlots(self.template, self.slots, null);
      self.close();
      new EquationWorkspaceModal(self.app, self.plugin, self.editor, compiled, self.item).open();
    });

    var insertBtn = footer.createEl("button", { text: "Insert Formula (Enter)", cls: "mod-cta" });
    insertBtn.type = "button";
    this.comp.registerDomEvent(insertBtn, "click", function() { self.commitToEditor(); });

    this.updatePreview();
    window.setTimeout(function() {
      if (self.slotInputs.length > 0) self.slotInputs[0].input.focus();
    }, 25);
  }

  async updatePreview() {
    this.renderComp.unload();
    this.renderComp = new obsidian.Component();
    this.renderComp.load();
    this.previewBox.empty();
    var compiled = compileTemplateWithSlots(this.template, this.slots, this.activeSlotId);
    try {
      await obsidian.MarkdownRenderer.render(this.app, wrapMath(compiled, "block"), this.previewBox, "", this.renderComp);
    } catch (e) {
      this.previewBox.createEl("code", { text: compiled });
    }
  }

  commitToEditor() {
    var compiled = compileTemplateWithSlots(this.template, this.slots, null);
    if (this.replaceRange) {
      this.editor.replaceRange(compiled, this.replaceRange.start, this.replaceRange.end);
    } else if (this.editor) {
      this.editor.replaceSelection(compiled);
    }
    this.close();
  }

  onClose() {
    this.comp.unload();
    this.renderComp.unload();
    this.contentEl.empty();
  }
}

// ============================================================================
// 9. INTERACTIVE STEM BUILDER WORKSPACE MODAL (v4.5 — Full Reflow, Guide & EE)
// ============================================================================
class EquationWorkspaceModal extends obsidian.Modal {
  constructor(app, plugin, editor, initialText, initialItem) {
    super(app);
    this.plugin = plugin;
    this.editor = editor;
    this.currentLatex = initialText ? initialText.trim() : "";
    this.domain = (initialItem && initialItem.domain && TAXONOMY[initialItem.domain])
      ? initialItem.domain
      : (plugin.settings.defaultDomain && TAXONOMY[plugin.settings.defaultDomain] ? plugin.settings.defaultDomain : "math");
    this.activeTopic = (initialItem && initialItem.topic) ? initialItem.topic : "all";
    this.activeSubtopic = (initialItem && initialItem.subtopic) ? initialItem.subtopic : "all";
    this.filterLayout = plugin.settings.filterLayout || "bar";
    this.uiScale = plugin.settings.uiScale || "115";
    this.pillsCollapsed = false;
    this.showWolframGuide = false;

    this.activeWizard = null;
    this.activeTemplate = initialItem ? initialItem.latex : this.currentLatex;
    this.slots = [];
    this.activeSlotId = null;
    this.rawCursorHighlight = false;

    // Matrix state (with Base Symbol & Fill Mode so resizing 4x5 never mixes 0s with a_ij)
    this.matRows = 3;
    this.matCols = 3;
    this.matBracket = "bmatrix";
    this.matBaseSym = "a";
    this.matFillMode = "symbolic"; // "symbolic" | "zeros" | "identity"
    this.matCells = [
      ["a_{11}", "a_{12}", "a_{13}"],
      ["a_{21}", "a_{22}", "a_{23}"],
      ["a_{31}", "a_{32}", "a_{33}"]
    ];

    // Chemical Equation Card state (with Both Above & Below Arrow Conditions)
    this.chemReactants = [
      { coeff: "2", formula: "H_2", state: "g", charge: "" },
      { coeff: "1", formula: "O_2", state: "g", charge: "" }
    ];
    this.chemArrow = "\\rightarrow";
    this.chemAbove = "\\Delta";
    this.chemBelow = "";
    this.chemProducts = [
      { coeff: "2", formula: "H_2O", state: "l", charge: "" }
    ];

    // Piecewise state
    this.piecewiseFunc = "f(x)";
    this.piecewiseRows = [
      { expr: "x^2", cond: "x \\ge 0" },
      { expr: "-x", cond: "x < 0" }
    ];

    // EE Formalizations state
    this.eeSubfieldKey = "dc_ac_circuits";
    this.eeTemplateIdx = 0;

    this.comp = new obsidian.Component();
    this.renderComponent = new obsidian.Component();
    this.updateTimer = null;
  }

  onOpen() {
    this.comp.load();
    this.renderComponent.load();
    this.plugin.activeBuilderModal = this;
    this.modalEl.addClass("latex-toolbox-equation-modal");
    this.modalEl.setAttr("data-ui-scale", this.uiScale);
    var contentEl = this.contentEl;
    contentEl.empty();
    contentEl.addClass("latex-toolbox-equation-workspace");

    var self = this;

    // 1. Compact Header with UI Scale & Filter Mode Switcher
    var head = contentEl.createDiv("lt-header");
    var titleGroup = head.createDiv();
    titleGroup.createEl("h2", { text: "Interactive STEM Builder" });

    var headActions = head.createDiv("lt-header-actions");

    var scaleSelect = headActions.createEl("select", {
      cls: "dropdown lt-compact-dropdown",
      attr: { title: "Adjust UI Font & Box Sizing" }
    });
    [
      { v: "100", t: "🔍 Size: 100%" },
      { v: "115", t: "🔍 Size: 115% (Optimal)" },
      { v: "130", t: "🔍 Size: 130% (Large)" }
    ].forEach(function(sc) {
      var o = scaleSelect.createEl("option", { value: sc.v, text: sc.t });
      if (self.uiScale === sc.v) o.selected = true;
    });
    this.comp.registerDomEvent(scaleSelect, "change", function() {
      self.uiScale = scaleSelect.value;
      self.plugin.settings.uiScale = self.uiScale;
      self.plugin.saveSettings();
      self.modalEl.setAttr("data-ui-scale", self.uiScale);
    });

    var modeSwitchBtn = headActions.createEl("button", {
      cls: "lt-mode-toggle-btn",
      text: this.filterLayout === "bar" ? "⇄ Filter: Compact Bar" : "⇄ Filter: Pill Rows"
    });
    modeSwitchBtn.type = "button";
    this.comp.registerDomEvent(modeSwitchBtn, "click", function() {
      self.filterLayout = self.filterLayout === "bar" ? "pills" : "bar";
      self.plugin.settings.filterLayout = self.filterLayout;
      self.plugin.saveSettings();
      modeSwitchBtn.setText(self.filterLayout === "bar" ? "⇄ Filter: Compact Bar" : "⇄ Filter: Pill Rows");
      self.renderDirectoryFilter();
    });

    var floatSolverBtn = headActions.createEl("button", {
      cls: "lt-mode-toggle-btn mod-cta",
      text: "❐ Open Floating Step-by-Step Solver"
    });
    floatSolverBtn.type = "button";
    this.comp.registerDomEvent(floatSolverBtn, "click", function() {
      self.plugin.openFloatingSolver(self);
    });

    // 2. WolframAlpha / Maple / MATLAB Natural Math Bar + Guide Drawer Button
    var natBar = contentEl.createDiv("lt-natural-math-bar");
    natBar.createSpan({ text: "Wolfram / MATLAB:", cls: "lt-nat-label" });
    this.natInputEl = natBar.createEl("input", {
      cls: "lt-slot-input lt-nat-input",
      attr: {
        type: "text",
        placeholder: "Type natural math: int(x^2*sin(x), x, 0, pi) | diff(e^(-2*t), t, 2) | [a11 a12; a21 a22] | eye(3)"
      }
    });
    var natConvertBtn = natBar.createEl("button", { text: "⚡ Convert", cls: "mod-cta lt-compact-btn" });
    natConvertBtn.type = "button";

    var natGuideBtn = natBar.createEl("button", {
      text: "📘 Guide & Examples",
      cls: "lt-compact-btn",
      attr: { "aria-pressed": String(this.showWolframGuide) }
    });
    natGuideBtn.type = "button";

    var extSolveBtn = natBar.createEl("button", {
      text: "🌐 Wolfram / AI",
      cls: "lt-compact-btn",
      attr: { title: "Compute in WolframAlpha or copy step-by-step prompt for DeepSeek/ChatGPT/Claude/Gemini" }
    });
    extSolveBtn.type = "button";
    this.comp.registerDomEvent(extSolveBtn, "click", function() {
      var currentMath = self.inputEl ? self.inputEl.value.trim() : self.natInputEl.value.trim();
      if (!currentMath) {
        new obsidian.Notice("Please enter or select a formula first!");
        return;
      }
      var prompt = "Please provide a rigorous, clear, step-by-step mathematical derivation and solution for the following:\n\n$$\n" + currentMath + "\n$$\n\nExplain each step clearly with underlying theorems and formulas.";
      navigator.clipboard.writeText(prompt).then(function() {
        new obsidian.Notice("Copied step-by-step prompt to clipboard!");
      });
      window.open("https://www.wolframalpha.com/input?i=" + encodeURIComponent(currentMath));
    });

    this.wolframGuideHost = contentEl.createDiv("lt-wolfram-guide-host is-hidden");

    var runNaturalConversion = function() {
      var raw = self.natInputEl.value.trim();
      if (!raw) return;
      var matCheck = parseMatlabMatrixInput(raw, self.matBracket);
      if (matCheck) {
        self.matRows = matCheck.rows;
        self.matCols = matCheck.cols;
        self.matCells = matCheck.cells;
        self.selectWizardWithLogicalSync("matrix");
        return;
      }
      self.activeWizard = null;
      self.renderWizardButtons();
      self.renderWizardPanel();
      var converted = wolframNaturalToLatex(raw);
      self.loadTemplateIntoSlots(converted, true);
    };

    this.comp.registerDomEvent(natConvertBtn, "click", runNaturalConversion);
    this.comp.registerDomEvent(this.natInputEl, "keydown", function(e) {
      if (e.key === "Enter") {
        e.preventDefault();
        runNaturalConversion();
      }
    });
    this.comp.registerDomEvent(natGuideBtn, "click", function() {
      self.showWolframGuide = !self.showWolframGuide;
      natGuideBtn.setAttr("aria-pressed", String(self.showWolframGuide));
      self.renderWolframGuideDrawer(runNaturalConversion);
    });

    // 3. Switchable Directory Filter
    this.treeContainer = contentEl.createDiv("lt-tree-container");
    this.renderDirectoryFilter();

    // 4. Clean Scrollable Pill Bar with all 11 Interactive Builders
    this.wizWrap = contentEl.createDiv("lt-wizard-scroll-bar");
    this.wizardsList = [
      { id: "derivative", label: "d/dx Derivative" },
      { id: "integral", label: "∫ Integral" },
      { id: "matrix", label: "[ ] 2D Matrix" },
      { id: "chemistry", label: "⇌ Chemical Eq" },
      { id: "ee_phasor", label: "⚡ EE Formalizations" },
      { id: "series", label: "∑/∏ Series" },
      { id: "limit", label: "lim Limit" },
      { id: "piecewise", label: "{ Piecewise" },
      { id: "vector", label: "∇ Vector & Del" },
      { id: "corner4", label: "⁴₂X Isotope/Sub" },
      { id: "floating_solver", label: "❐ Step-by-Step Solver" }
    ];
    this.renderWizardButtons();

    this.wizardHost = contentEl.createDiv("lt-wizard-host");

    // 5. Filtered Quick Formula Chips + Database Example Loader
    var paletteSection = contentEl.createDiv("lt-palette-section");
    var paletteHeader = paletteSection.createDiv("lt-palette-header-row");
    this.paletteTitleEl = paletteHeader.createSpan({ text: "Topic Formulas (Click any chip to load protected slots):", cls: "lt-section-label" });

    this.exampleSelect = paletteHeader.createEl("select", { cls: "dropdown lt-compact-dropdown" });
    this.comp.registerDomEvent(this.exampleSelect, "change", function() {
      var val = self.exampleSelect.value;
      if (!val) return;
      // Ensure protected slot cards are visible when user picks a database example!
      if (self.activeWizard === "matrix" || self.activeWizard === "chemistry") {
        self.activeWizard = null;
        self.renderWizardButtons();
        self.renderWizardPanel();
      }
      self.loadTemplateIntoSlots(val, true);
      self.exampleSelect.value = "";
    });

    this.paletteWrap = paletteSection.createDiv("lt-palette-scroll");
    this.renderScopedPalette();

    // 6. Protected Valid Input Fields
    this.slotSection = contentEl.createDiv("lt-slot-section");
    this.renderProtectedSlots();

    // 7. Composer Grid (No horizontal clipping! Supports Live Cursor Highlighting in Raw LaTeX)
    var composer = contentEl.createDiv("lt-composer-grid");
    var inputPanel = composer.createDiv("lt-panel lt-input-panel-rel");
    var inputHead = inputPanel.createDiv("lt-panel-head");
    inputHead.createSpan({ text: "LaTeX Code (Click inside any { } or slot to highlight in preview)", cls: "lt-panel-title" });
    this.syntaxBadge = inputHead.createSpan({ text: "✓ Syntax Valid", cls: "lt-slot-status is-valid" });

    this.tokenOverlayEl = inputPanel.createDiv("lt-token-overlay-bar");

    this.inputEl = inputPanel.createEl("textarea", {
      cls: "lt-input",
      attr: { rows: "5", placeholder: "Type trigger (e.g. ddx, int, ohm, nernst) or any custom LaTeX equation..." }
    });
    this.inputEl.value = this.currentLatex;

    this.acDropdown = inputPanel.createDiv("lt-builder-ac-dropdown is-hidden");

    attachSmartMathInputBehaviors(this.comp, this.inputEl, this.plugin, function(newVal) {
      self.activeTemplate = newVal;
      self.rawCursorHighlight = true;
      self.validateRawLatex();
      self.scheduleUpdate();
    });

    this.comp.registerDomEvent(this.inputEl, "input", function() {
      self.activeTemplate = self.inputEl.value;
      self.rawCursorHighlight = true;
      self.handleBuilderAutocomplete();
      self.validateRawLatex();
      self.scheduleUpdate();
    });

    // Live cursor tracking inside custom LaTeX equations so { ... } under cursor highlights in preview!
    ["click", "keyup"].forEach(function(ev) {
      self.comp.registerDomEvent(self.inputEl, ev, function() {
        self.rawCursorHighlight = true;
        self.scheduleUpdate();
      });
    });

    this.comp.registerDomEvent(this.inputEl, "keydown", function(e) {
      if (self.handleAutocompleteKeydown(e)) return;
    });

    var previewPanel = composer.createDiv("lt-panel");
    previewPanel.createDiv({ text: "Live Rendered Preview (Active field / cursor highlighted in Neon Callout)", cls: "lt-panel-title" });
    this.previewEl = previewPanel.createDiv("lt-preview");

    // Footer
    var footer = contentEl.createDiv("lt-footer");
    var detectSlotsBtn = footer.createEl("button", { text: "🔒 Auto-Lock { } into Valid Slots" });
    detectSlotsBtn.type = "button";
    this.comp.registerDomEvent(detectSlotsBtn, "click", function() {
      self.activeWizard = null;
      self.renderWizardButtons();
      self.renderWizardPanel();
      self.loadTemplateIntoSlots(self.inputEl.value, true);
    });

    if (this.editor) {
      var insertBtn = footer.createEl("button", { text: "Insert into note", cls: "mod-cta" });
      insertBtn.type = "button";
      this.comp.registerDomEvent(insertBtn, "click", function() { self.insertIntoNote(); });
    }

    var copyBtn = footer.createEl("button", { text: "Copy LaTeX" });
    copyBtn.type = "button";
    this.comp.registerDomEvent(copyBtn, "click", function() {
      navigator.clipboard.writeText(self.inputEl.value).then(function() {
        new obsidian.Notice("LaTeX copied to clipboard.");
      });
    });

    var cancelBtn = footer.createEl("button", { text: "Close" });
    cancelBtn.type = "button";
    this.comp.registerDomEvent(cancelBtn, "click", function() { self.close(); });

    if (this.currentLatex) {
      this.loadTemplateIntoSlots(this.currentLatex, true);
    } else {
      this.updatePreview();
    }
  }

  // --- WOLFRAM / MATLAB INTERACTIVE GUIDE & EXAMPLES DRAWER ---
  renderWolframGuideDrawer(onRunExample) {
    this.wolframGuideHost.empty();
    if (!this.showWolframGuide) {
      this.wolframGuideHost.addClass("is-hidden");
      return;
    }
    this.wolframGuideHost.removeClass("is-hidden");
    var self = this;

    var head = this.wolframGuideHost.createDiv("lt-wiz-card-header");
    head.createSpan({
      text: "📘 WolframAlpha, Maple & MATLAB Natural Input Guide (Click any example to load & convert)",
      cls: "lt-panel-title"
    });
    var closeG = head.createEl("button", { text: "Hide Guide ✕", cls: "lt-subtopic-chip" });
    closeG.type = "button";
    this.comp.registerDomEvent(closeG, "click", function() {
      self.showWolframGuide = false;
      self.wolframGuideHost.addClass("is-hidden");
    });

    var grid = this.wolframGuideHost.createDiv("lt-guide-grid");
    WOLFRAM_GUIDE_CATEGORIES.forEach(function(cat) {
      var col = grid.createDiv("lt-guide-col");
      col.createDiv({ text: cat.category, cls: "lt-section-label" });
      cat.items.forEach(function(item) {
        var row = col.createDiv("lt-guide-item");
        row.createEl("code", { text: item.syntax, cls: "lt-guide-code" });
        row.createSpan({ text: item.desc, cls: "lt-guide-desc" });
        self.comp.registerDomEvent(row, "click", function() {
          self.natInputEl.value = item.syntax;
          onRunExample();
        });
      });
    });
  }

  renderWizardButtons() {
    if (!this.wizWrap) return;
    this.wizWrap.empty();
    var self = this;
    this.wizardsList.forEach(function(w) {
      var btn = self.wizWrap.createEl("button", { text: w.label, cls: "lt-wizard-btn" });
      btn.type = "button";
      btn.setAttr("aria-pressed", String(self.activeWizard === w.id));
      self.comp.registerDomEvent(btn, "click", function() {
        if (w.id === "floating_solver") {
          self.plugin.openFloatingSolver(self);
          return;
        }
        var nextWiz = self.activeWizard === w.id ? null : w.id;
        self.selectWizardWithLogicalSync(nextWiz);
      });
    });
  }

  selectWizardWithLogicalSync(wizId) {
    this.activeWizard = wizId;
    if (wizId && WIZARD_DOMAIN_MAP[wizId]) {
      var map = WIZARD_DOMAIN_MAP[wizId];
      this.domain = map.domain;
      this.activeTopic = map.topic || "all";
      this.activeSubtopic = "all";
      this.renderDirectoryFilter();
      this.renderScopedPalette();
    }
    this.renderWizardButtons();
    this.renderWizardPanel();
    this.renderProtectedSlots();
  }

  renderDirectoryFilter() {
    var container = this.treeContainer;
    container.empty();
    var self = this;
    var currentDom = TAXONOMY[this.domain] || TAXONOMY.math;

    var onSubjectPicked = function(domKey) {
      self.domain = domKey;
      self.activeTopic = "all";
      self.activeSubtopic = "all";
      if (domKey === "chemistry" && self.activeWizard && self.activeWizard !== "chemistry") {
        self.activeWizard = "chemistry";
        self.renderWizardButtons();
        self.renderWizardPanel();
      } else if (domKey === "electronics" && self.activeWizard && self.activeWizard !== "ee_phasor") {
        self.activeWizard = "ee_phasor";
        self.renderWizardButtons();
        self.renderWizardPanel();
      }
      self.renderDirectoryFilter();
      self.renderScopedPalette();
      self.renderProtectedSlots();
    };

    if (this.filterLayout === "bar") {
      var bar = container.createDiv("lt-compact-horizontal-bar");
      var subjGroup = bar.createDiv("lt-compact-subj-pills");
      Object.keys(TAXONOMY).forEach(function(domKey) {
        var dom = TAXONOMY[domKey];
        var btn = subjGroup.createEl("button", {
          cls: "lt-domain-button lt-compact-pill",
          text: dom.icon + " " + dom.label
        });
        btn.type = "button";
        btn.setAttr("aria-pressed", String(self.domain === domKey));
        self.comp.registerDomEvent(btn, "click", function() { onSubjectPicked(domKey); });
      });

      var selectsGroup = bar.createDiv("lt-compact-selects");
      var branchSelect = selectsGroup.createEl("select", { cls: "dropdown lt-compact-dropdown" });
      branchSelect.createEl("option", { value: "all", text: "Branch: All " + currentDom.label });
      Object.keys(currentDom.topics).forEach(function(tKey) {
        var opt = branchSelect.createEl("option", { value: tKey, text: "Branch: " + currentDom.topics[tKey].label });
        if (self.activeTopic === tKey) opt.selected = true;
      });

      this.comp.registerDomEvent(branchSelect, "change", function() {
        self.activeTopic = branchSelect.value;
        self.activeSubtopic = "all";
        if (self.domain === "electronics" && self.activeTopic !== "all" && EE_FORMALIZATIONS[self.activeTopic]) {
          self.eeSubfieldKey = self.activeTopic;
          if (self.activeWizard === "ee_phasor") self.renderWizardPanel();
        }
        self.renderDirectoryFilter();
        self.renderScopedPalette();
      });

      if (this.activeTopic !== "all" && currentDom.topics[this.activeTopic]) {
        var conceptSelect = selectsGroup.createEl("select", { cls: "dropdown lt-compact-dropdown" });
        conceptSelect.createEl("option", { value: "all", text: "Concept: All" });
        (currentDom.topics[this.activeTopic].subtopics || []).forEach(function(sub) {
          var opt = conceptSelect.createEl("option", { value: sub, text: "Concept: " + sub });
          if (self.activeSubtopic === sub) opt.selected = true;
        });
        this.comp.registerDomEvent(conceptSelect, "change", function() {
          self.activeSubtopic = conceptSelect.value;
          self.renderScopedPalette();
        });
      }
      return;
    }

    // Pill Rows Mode
    var row1 = container.createDiv("lt-tree-row");
    row1.createSpan({ text: "Subject:", cls: "lt-tree-label" });
    var domWrap = row1.createDiv("lt-domain-grid");

    Object.keys(TAXONOMY).forEach(function(domKey) {
      var dom = TAXONOMY[domKey];
      var btn = domWrap.createEl("button", {
        cls: "lt-domain-button lt-compact-pill",
        text: dom.icon + " " + dom.label
      });
      btn.type = "button";
      btn.setAttr("aria-pressed", String(self.domain === domKey));
      self.comp.registerDomEvent(btn, "click", function() { onSubjectPicked(domKey); });
    });

    var collapseBtn = row1.createEl("button", {
      cls: "lt-collapse-tree-btn",
      text: this.pillsCollapsed ? "▼ Branches" : "▲ Hide"
    });
    collapseBtn.type = "button";
    this.comp.registerDomEvent(collapseBtn, "click", function() {
      self.pillsCollapsed = !self.pillsCollapsed;
      self.renderDirectoryFilter();
    });

    if (this.pillsCollapsed) return;

    var row2 = container.createDiv("lt-tree-row");
    row2.createSpan({ text: "Branch:", cls: "lt-tree-label" });
    var topicWrap = row2.createDiv("lt-domain-grid");

    var allTBtn = topicWrap.createEl("button", { cls: "lt-topic-chip lt-compact-pill", text: "All" });
    allTBtn.type = "button";
    allTBtn.setAttr("aria-pressed", String(this.activeTopic === "all"));
    this.comp.registerDomEvent(allTBtn, "click", function() {
      self.activeTopic = "all";
      self.activeSubtopic = "all";
      self.renderDirectoryFilter();
      self.renderScopedPalette();
    });

    Object.keys(currentDom.topics).forEach(function(tKey) {
      var tBtn = topicWrap.createEl("button", {
        cls: "lt-topic-chip lt-compact-pill",
        text: currentDom.topics[tKey].label
      });
      tBtn.type = "button";
      tBtn.setAttr("aria-pressed", String(self.activeTopic === tKey));
      self.comp.registerDomEvent(tBtn, "click", function() {
        self.activeTopic = tKey;
        self.activeSubtopic = "all";
        if (self.domain === "electronics" && EE_FORMALIZATIONS[tKey]) {
          self.eeSubfieldKey = tKey;
          if (self.activeWizard === "ee_phasor") self.renderWizardPanel();
        }
        self.renderDirectoryFilter();
        self.renderScopedPalette();
      });
    });

    if (this.activeTopic !== "all" && currentDom.topics[this.activeTopic]) {
      var row3 = container.createDiv("lt-tree-row");
      row3.createSpan({ text: "Concept:", cls: "lt-tree-label" });
      var subWrap = row3.createDiv("lt-domain-grid");

      var allSBtn = subWrap.createEl("button", { cls: "lt-subtopic-chip", text: "All" });
      allSBtn.type = "button";
      allSBtn.setAttr("aria-pressed", String(this.activeSubtopic === "all"));
      this.comp.registerDomEvent(allSBtn, "click", function() {
        self.activeSubtopic = "all";
        self.renderDirectoryFilter();
        self.renderScopedPalette();
      });

      (currentDom.topics[this.activeTopic].subtopics || []).forEach(function(subName) {
        var sBtn = subWrap.createEl("button", { cls: "lt-subtopic-chip", text: subName });
        sBtn.type = "button";
        sBtn.setAttr("aria-pressed", String(self.activeSubtopic === subName));
        self.comp.registerDomEvent(sBtn, "click", function() {
          self.activeSubtopic = subName;
          self.renderDirectoryFilter();
          self.renderScopedPalette();
        });
      });
    }
  }

  renderScopedPalette() {
    if (!this.paletteWrap) return;
    this.paletteWrap.empty();
    var self = this;

    var domObj = TAXONOMY[this.domain] || TAXONOMY.math;
    var branchLabel = (this.activeTopic !== "all" && domObj.topics[this.activeTopic])
      ? " · " + domObj.topics[this.activeTopic].label
      : "";
    if (this.paletteTitleEl) {
      this.paletteTitleEl.setText(domObj.label + branchLabel + " Formulas (Click to load slots):");
    }

    // Protection: Scoped loading from domain/topic index instead of searching everything!
    var pool = [];
    if (this.plugin.topicIndex && this.activeTopic !== "all") {
      pool = (this.plugin.topicIndex[this.domain + ":" + this.activeTopic] || []).concat(
        this.plugin.topicIndex["all:" + this.activeTopic] || []
      );
    } else if (this.plugin.domainIndex) {
      pool = (this.plugin.domainIndex[this.domain] || []).concat(
        this.plugin.domainIndex["all"] || []
      );
    } else {
      pool = [].concat(
        this.plugin.settings.customSnippets || [],
        this.plugin.settings.customTemplates || []
      );
    }

    var allItems = pool.filter(function(item) {
      if (item.enabled === false) return false;
      if (item.domain !== "all" && item.domain !== self.domain) return false;
      if (self.activeTopic !== "all" && item.topic && item.topic !== self.activeTopic) return false;
      if (self.activeSubtopic !== "all" && item.subtopic && item.subtopic !== self.activeSubtopic) return false;
      return true;
    });

    if (this.exampleSelect) {
      this.exampleSelect.empty();
      var maxExampleOptions = 80;
      var promptText = allItems.length > maxExampleOptions
        ? "✨ Load Example (Top 80 of " + allItems.length + ")"
        : "✨ Load Example (" + allItems.length + ")";
      this.exampleSelect.createEl("option", { value: "", text: promptText });
      allItems.slice(0, maxExampleOptions).forEach(function(item) {
        self.exampleSelect.createEl("option", {
          value: item.latex,
          text: (item.name || item.trigger) + " [" + item.trigger + "]"
        });
      });
    }

    if (allItems.length === 0) {
      this.paletteWrap.createDiv({ text: "No formulas in this specific concept filter yet. Select 'All' or type trigger below.", cls: "lt-subtitle" });
      return;
    }

    var chunkSize = 35;
    var renderedCount = 0;

    var renderChunk = function(startIdx, count) {
      var slice = allItems.slice(startIdx, startIdx + count);
      slice.forEach(function(item) {
        var chip = self.paletteWrap.createEl("button", {
          cls: "lt-palette-chip",
          text: (item.name || item.trigger) + " (" + item.trigger + ")"
        });
        chip.type = "button";
        chip.title = item.latex;
        chip.onclick = function() {
          if (self.activeWizard === "matrix" || self.activeWizard === "chemistry") {
            self.activeWizard = null;
            self.renderWizardButtons();
            self.renderWizardPanel();
          }
          self.loadTemplateIntoSlots(item.latex, true);
        };
      });
      renderedCount += slice.length;

      var existingMoreBtn = self.paletteWrap.querySelector(".lt-palette-more-btn");
      if (existingMoreBtn) existingMoreBtn.remove();

      if (renderedCount < allItems.length) {
        var remaining = allItems.length - renderedCount;
        var moreBtn = self.paletteWrap.createEl("button", {
          cls: "lt-palette-chip mod-cta lt-palette-more-btn",
          text: "+ Show More (" + remaining + " remaining)"
        });
        moreBtn.type = "button";
        moreBtn.onclick = function() {
          renderChunk(renderedCount, chunkSize);
        };
      }
    };

    renderChunk(0, chunkSize);
  }

  // --- 11 INTERACTIVE OPERATOR WIZARDS ---
  renderWizardPanel() {
    this.wizardHost.empty();
    if (!this.activeWizard) return;
    var self = this;
    var card = this.wizardHost.createDiv("lt-wizard-card");

    var createWizHeader = function(titleText, badgeEl, examples) {
      var h = card.createDiv("lt-wiz-card-header");
      var leftH = h.createDiv("lt-wiz-header-left");
      leftH.createSpan({ text: titleText, cls: "lt-panel-title" });
      if (badgeEl) leftH.appendChild(badgeEl);

      if (examples && examples.length > 0) {
        var exSel = h.createEl("select", { cls: "dropdown lt-compact-dropdown" });
        exSel.createEl("option", { value: "", text: "✨ Load Preset Example..." });
        examples.forEach(function(ex, i) {
          exSel.createEl("option", { value: String(i), text: ex.label });
        });
        self.comp.registerDomEvent(exSel, "change", function() {
          var picked = examples[Number(exSel.value)];
          if (picked && picked.onPick) picked.onPick();
          else if (picked && picked.latex) self.loadTemplateIntoSlots(picked.latex, false);
          exSel.value = "";
        });
      }
    };

    // 1. DERIVATIVE
    if (this.activeWizard === "derivative") {
      createWizHeader("Derivative Builder (ddx / d/dx / ∂)", null, [
        { label: "Velocity v = dx/dt", latex: "v(t) = \\frac{d ${1:x(t)}}{d ${2:t}}" },
        { label: "Inductor v = L di/dt", latex: "v(t) = ${1:L}\\frac{d ${2:i(t)}}{d ${3:t}}" },
        { label: "Wave Equation ∂²u/∂t²", latex: "\\frac{\\partial^2 ${1:u}}{\\partial ${2:t}^2} = c^2 \\frac{\\partial^2 ${1:u}}{\\partial ${3:x}^2}" }
      ]);
      var rowD = card.createDiv("lt-wizard-controls");
      var typeSel = rowD.createEl("select", { cls: "dropdown lt-compact-dropdown" });
      typeSel.createEl("option", { value: "d", text: "Ordinary (d/dx)" });
      typeSel.createEl("option", { value: "\\partial", text: "Partial (∂/∂x)" });

      var ordSel = rowD.createEl("select", { cls: "dropdown lt-compact-dropdown" });
      ordSel.createEl("option", { value: "1", text: "1st Order" });
      ordSel.createEl("option", { value: "2", text: "2nd Order" });
      ordSel.createEl("option", { value: "n", text: "n-th Order" });

      var fmtSel = rowD.createEl("select", { cls: "dropdown lt-compact-dropdown" });
      fmtSel.createEl("option", { value: "inline_num", text: "dy / dx" });
      fmtSel.createEl("option", { value: "operator", text: "d/dx ( f(x) ) with Brackets" });

      var applyDeriv = function() {
        var sym = typeSel.value;
        var ord = ordSel.value;
        var isOp = fmtSel.value === "operator";
        var tpl = ord === "1"
          ? (isOp ? "\\frac{" + sym + "}{" + sym + " ${2:x}}\\left( ${1:f(x)} \\right)" : "\\frac{" + sym + " ${1:y}}{" + sym + " ${2:x}}")
          : (isOp ? "\\frac{" + sym + "^{" + ord + "}}{" + sym + " ${2:x}^{" + ord + "}}\\left( ${1:f(x)} \\right)" : "\\frac{" + sym + "^{" + ord + "} ${1:y}}{" + sym + " ${2:x}^{" + ord + "}}");
        self.loadTemplateIntoSlots(tpl, false);
      };
      this.comp.registerDomEvent(typeSel, "change", applyDeriv);
      this.comp.registerDomEvent(ordSel, "change", applyDeriv);
      this.comp.registerDomEvent(fmtSel, "change", applyDeriv);
      applyDeriv();
    }

    // 2. INTEGRAL
    else if (this.activeWizard === "integral") {
      createWizHeader("Integral Builder (int / iint / oint)", null, [
        { label: "RMS Voltage Integral", latex: "V_{\\text{rms}} = \\sqrt{\\frac{1}{${1:T}} \\int_{${2:0}}^{${1:T}} \\left( ${3:v(t)} \\right)^2\\,d${4:t}}" },
        { label: "Fourier Transform F(ω)", latex: "F(\\omega) = \\int_{${1:-\\infty}}^{${2:\\infty}} ${3:f(t)}\\,e^{-j\\omega t}\\,d${4:t}" },
        { label: "Gauss's Law ∮ E·dA", latex: "\\oint_{${1:S}} ${2:\\mathbf{E}} \\cdot d\\mathbf{A} = \\frac{${3:Q_{\\text{enc}}}}{\\varepsilon_0}" }
      ]);
      var rowI = card.createDiv("lt-wizard-controls");
      var modeSel = rowI.createEl("select", { cls: "dropdown lt-compact-dropdown" });
      modeSel.createEl("option", { value: "def", text: "Definite Integral (∫ a to b)" });
      modeSel.createEl("option", { value: "indef", text: "Indefinite Integral (∫ f(x) dx + C)" });
      modeSel.createEl("option", { value: "double", text: "Double Integral (∬)" });
      modeSel.createEl("option", { value: "triple", text: "Triple Integral (∭)" });
      modeSel.createEl("option", { value: "closed", text: "Closed Contour (∮)" });

      var brkLabel = rowI.createEl("label", { cls: "lt-inline-checkbox" });
      var brkCheck = brkLabel.createEl("input", { attr: { type: "checkbox" } });
      brkCheck.checked = true;
      brkLabel.createSpan({ text: "Auto-bracket integrand ( f(x) )" });

      var applyInt = function() {
        var m = modeSel.value;
        var wrapF = brkCheck.checked ? "\\left( ${3:f(x)} \\right)" : "${3:f(x)}";
        var wrapIndef = brkCheck.checked ? "\\left( ${1:f(x)} \\right)" : "${1:f(x)}";
        var tpl = "\\int_{${1:a}}^{${2:b}} " + wrapF + "\\,d${4:x}";
        if (m === "indef") tpl = "\\int " + wrapIndef + "\\,d${2:x} + C";
        else if (m === "double") tpl = "\\iint_{${1:R}} \\left( ${2:f(x,y)} \\right)\\,d${3:x}\\,d${4:y}";
        else if (m === "triple") tpl = "\\iiint_{${1:V}} \\left( ${2:f(x,y,z)} \\right)\\,dV";
        else if (m === "closed") tpl = "\\oint_{${1:C}} ${2:\\mathbf{F}} \\cdot d${3:\\mathbf{r}}";
        self.loadTemplateIntoSlots(tpl, false);
      };
      this.comp.registerDomEvent(modeSel, "change", applyInt);
      this.comp.registerDomEvent(brkCheck, "change", applyInt);
      applyInt();
    }

    // 3. SMART 2D MATRIX BUILDER (Auto b25 -> b_{25}, Base Symbol Prefix & Full-Width Reflow for 6x6!)
    else if (this.activeWizard === "matrix") {
      var rebuildMatrixGridUI;
      createWizHeader("Smart 2D Matrix Builder (Type 'b25' or 'Z12' in any cell to auto-format b_{25})", null, [
        {
          label: "2x2 ABCD Transmission Matrix",
          onPick: function() {
            self.matRows = 2; self.matCols = 2; self.matBracket = "bmatrix";
            self.matCells = [["A", "B"], ["C", "D"]];
            rebuildMatrixGridUI();
          }
        },
        {
          label: "3x3 Impedance Matrix Z",
          onPick: function() {
            self.matRows = 3; self.matCols = 3; self.matBracket = "bmatrix"; self.matBaseSym = "Z";
            self.matCells = [["Z_{11}", "Z_{12}", "Z_{13}"], ["Z_{21}", "Z_{22}", "Z_{23}"], ["Z_{31}", "Z_{32}", "Z_{33}"]];
            rebuildMatrixGridUI();
          }
        },
        {
          label: "3x3 Curl Determinant",
          onPick: function() {
            self.matRows = 3; self.matCols = 3; self.matBracket = "vmatrix";
            self.matCells = [["\\hat{i}", "\\hat{j}", "\\hat{k}"], ["\\partial_x", "\\partial_y", "\\partial_z"], ["F_x", "F_y", "F_z"]];
            rebuildMatrixGridUI();
          }
        }
      ]);

      // Top Control Bar (Full width so large matrices have plenty of room below!)
      var ctrlBar = card.createDiv("lt-matrix-top-controls");
      var brkSel = ctrlBar.createEl("select", { cls: "dropdown lt-compact-dropdown" });
      [
        { v: "bmatrix", t: "[ ] bmatrix" },
        { v: "pmatrix", t: "( ) pmatrix" },
        { v: "vmatrix", t: "| | vmatrix" }
      ].forEach(function(o) {
        var opt = brkSel.createEl("option", { value: o.v, text: o.t });
        if (self.matBracket === o.v) opt.selected = true;
      });

      var rSel = ctrlBar.createEl("select", { cls: "dropdown lt-compact-dropdown" });
      var cSel = ctrlBar.createEl("select", { cls: "dropdown lt-compact-dropdown" });
      [1, 2, 3, 4, 5, 6].forEach(function(n) {
        var ro = rSel.createEl("option", { value: String(n), text: n + " Rows" });
        if (self.matRows === n) ro.selected = true;
        var co = cSel.createEl("option", { value: String(n), text: n + " Cols" });
        if (self.matCols === n) co.selected = true;
      });

      ctrlBar.createSpan({ text: "Symbol:", cls: "lt-subtitle" });
      var symInp = ctrlBar.createEl("input", {
        cls: "lt-slot-input lt-mat-sym-input",
        attr: { type: "text", value: self.matBaseSym, title: "Base symbol for indexed entries (e.g. a, b, Z, Y)" }
      });

      var fillSymBtn = ctrlBar.createEl("button", { text: "Fill " + self.matBaseSym + "_{ij}", cls: "lt-subtopic-chip" });
      fillSymBtn.type = "button";
      var fillZerosBtn = ctrlBar.createEl("button", { text: "Fill 0s", cls: "lt-subtopic-chip" });
      fillZerosBtn.type = "button";
      var fillEyeBtn = ctrlBar.createEl("button", { text: "Fill I_n", cls: "lt-subtopic-chip" });
      fillEyeBtn.type = "button";

      // MATLAB Quick-Syntax Bar
      var matlabRow = card.createDiv("lt-matlab-input-row");
      var matlabInp = matlabRow.createEl("input", {
        cls: "lt-slot-input",
        attr: { type: "text", placeholder: "MATLAB / Shorthand: [a11 a12; b21 b22] or [1 2 3; 4 5 6] or eye(4) or diag(lambda_1, lambda_2)" }
      });
      var matlabApplyBtn = matlabRow.createEl("button", { text: "Apply MATLAB", cls: "lt-subtopic-chip mod-cta" });
      matlabApplyBtn.type = "button";

      var gridHost = card.createDiv("lt-matrix-2d-full-wrap");

      var defaultCellForCoord = function(r, c) {
        if (self.matFillMode === "zeros") return "0";
        if (self.matFillMode === "identity") return r === c ? "1" : "0";
        var sym = (self.matBaseSym || "a").trim();
        return sym + "_{" + (r + 1) + (c + 1) + "}";
      };

      var syncMatrixToLatex = function() {
        var count = 1;
        var rowLines = [];
        for (var r = 0; r < self.matRows; r++) {
          var colParts = [];
          for (var c = 0; c < self.matCols; c++) {
            var rawCell = (self.matCells[r] && self.matCells[r][c] !== undefined) ? self.matCells[r][c] : defaultCellForCoord(r, c);
            var formatted = autoFormatMatrixCellToken(rawCell, true);
            colParts.push("${" + count + ":" + formatted + "}");
            count++;
          }
          rowLines.push("  " + colParts.join(" & "));
        }
        var tpl = "\\begin{" + self.matBracket + "}\n" + rowLines.join(" \\\\\n") + "\n\\end{" + self.matBracket + "}";
        var extracted = extractTemplateSlots(tpl, false);
        self.activeTemplate = extracted.template;
        self.slots = extracted.slots;
        self.syncSlotsToTextarea();
        self.renderTokenOverlay();
        self.updatePreview();
      };

      rebuildMatrixGridUI = function() {
        gridHost.empty();
        var table = gridHost.createDiv("lt-matrix-2d-compact-grid");
        table.style.gridTemplateColumns = "repeat(" + self.matCols + ", minmax(68px, 110px))";
        var allCellInputs = [];

        for (var r = 0; r < self.matRows; r++) {
          if (!self.matCells[r]) self.matCells[r] = [];
          for (var c = 0; c < self.matCols; c++) {
            if (self.matCells[r][c] === undefined) {
              self.matCells[r][c] = defaultCellForCoord(r, c);
            }
            (function(ri, ci, flatIdx) {
              var cellBox = table.createDiv("lt-mat-cell-box");
              cellBox.createSpan({ text: (ri + 1) + "," + (ci + 1), cls: "lt-mat-coord-tag" });
              var inp = cellBox.createEl("input", {
                cls: "lt-slot-input lt-matrix-compact-cell",
                attr: {
                  type: "text",
                  value: self.matCells[ri][ci],
                  title: "Type 'b25' to auto-format as b_{25}"
                }
              });
              allCellInputs.push(inp);

              attachSmartMathInputBehaviors(self.comp, inp, self.plugin, function(v) {
                self.matCells[ri][ci] = v;
                syncMatrixToLatex();
              });

              self.comp.registerDomEvent(inp, "focus", function() {
                inp.select();
                self.activeSlotId = String(flatIdx + 1);
                self.rawCursorHighlight = false;
                self.updatePreview();
              });
              self.comp.registerDomEvent(inp, "input", function() {
                self.matCells[ri][ci] = inp.value;
                syncMatrixToLatex();
              });
              self.comp.registerDomEvent(inp, "blur", function() {
                // Auto-convert shorthand like b25 -> b_{25} cleanly in the input box on blur
                var formatted = autoFormatMatrixCellToken(inp.value, true);
                inp.value = formatted;
                self.matCells[ri][ci] = formatted;
                syncMatrixToLatex();
              });
              self.comp.registerDomEvent(inp, "keydown", function(e) {
                if (e.key === "Enter" || (e.key === "ArrowRight" && inp.selectionEnd === inp.value.length)) {
                  e.preventDefault();
                  if (flatIdx + 1 < allCellInputs.length) allCellInputs[flatIdx + 1].focus();
                  else allCellInputs[0].focus();
                } else if (e.key === "ArrowLeft" && inp.selectionStart === 0) {
                  e.preventDefault();
                  if (flatIdx - 1 >= 0) allCellInputs[flatIdx - 1].focus();
                } else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  var below = flatIdx + self.matCols;
                  if (below < allCellInputs.length) allCellInputs[below].focus();
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  var above = flatIdx - self.matCols;
                  if (above >= 0) allCellInputs[above].focus();
                }
              });
            })(r, c, r * self.matCols + c);
          }
        }
        syncMatrixToLatex();
      };

      var runMatlabParse = function() {
        var parsed = parseMatlabMatrixInput(matlabInp.value, self.matBracket);
        if (parsed) {
          self.matRows = parsed.rows;
          self.matCols = parsed.cols;
          self.matCells = parsed.cells;
          rSel.value = String(self.matRows);
          cSel.value = String(self.matCols);
          rebuildMatrixGridUI();
        } else {
          new obsidian.Notice("Use [1 2; 3 4], [a11 a12; a21 a22], eye(3), zeros(2,3), or diag(a,b,c)");
        }
      };

      this.comp.registerDomEvent(matlabApplyBtn, "click", runMatlabParse);
      this.comp.registerDomEvent(matlabInp, "keydown", function(e) {
        if (e.key === "Enter") { e.preventDefault(); runMatlabParse(); }
      });

      this.comp.registerDomEvent(symInp, "input", function() {
        self.matBaseSym = symInp.value.trim() || "a";
        fillSymBtn.setText("Fill " + self.matBaseSym + "_{ij}");
      });
      this.comp.registerDomEvent(brkSel, "change", function() { self.matBracket = brkSel.value; syncMatrixToLatex(); });
      this.comp.registerDomEvent(rSel, "change", function() { self.matRows = Number(rSel.value); rebuildMatrixGridUI(); });
      this.comp.registerDomEvent(cSel, "change", function() { self.matCols = Number(cSel.value); rebuildMatrixGridUI(); });
      this.comp.registerDomEvent(fillZerosBtn, "click", function() {
        self.matFillMode = "zeros";
        for (var r = 0; r < self.matRows; r++) {
          self.matCells[r] = [];
          for (var c = 0; c < self.matCols; c++) self.matCells[r][c] = "0";
        }
        rebuildMatrixGridUI();
      });
      this.comp.registerDomEvent(fillEyeBtn, "click", function() {
        self.matFillMode = "identity";
        for (var r = 0; r < self.matRows; r++) {
          self.matCells[r] = [];
          for (var c = 0; c < self.matCols; c++) self.matCells[r][c] = (r === c ? "1" : "0");
        }
        rebuildMatrixGridUI();
      });
      this.comp.registerDomEvent(fillSymBtn, "click", function() {
        self.matFillMode = "symbolic";
        var sym = (self.matBaseSym || "a").trim();
        for (var r = 0; r < self.matRows; r++) {
          self.matCells[r] = [];
          for (var c = 0; c < self.matCols; c++) self.matCells[r][c] = sym + "_{" + (r + 1) + (c + 1) + "}";
        }
        rebuildMatrixGridUI();
      });

      rebuildMatrixGridUI();
    }

    // 4. CHEMICAL EQUATION BUILDER (Case-Insensitive 'ph4' Fix + Above & Below Arrow + Unbalance Button)
    else if (this.activeWizard === "chemistry") {
      var renderChemCards;
      var chemBadgeEl = document.createElement("span");
      chemBadgeEl.className = "lt-slot-status is-valid";
      chemBadgeEl.textContent = "✓ Balanced";

      createWizHeader("Chemical Equation Builder (Auto-capitalizes e.g. 'ph4' → 'PH_4')", chemBadgeEl, [
        {
          label: "Combustion of Methane (CH₄ + 2O₂ → CO₂ + 2H₂O)",
          onPick: function() {
            self.chemReactants = [{ coeff: "1", formula: "CH_4", state: "g", charge: "" }, { coeff: "2", formula: "O_2", state: "g", charge: "" }];
            self.chemArrow = "\\rightarrow";
            self.chemAbove = "\\Delta";
            self.chemBelow = "";
            self.chemProducts = [{ coeff: "1", formula: "CO_2", state: "g", charge: "" }, { coeff: "2", formula: "H_2O", state: "g", charge: "" }];
            renderChemCards();
          }
        },
        {
          label: "Haber-Bosch Process (N₂ + 3H₂ ⇌ 2NH₃)",
          onPick: function() {
            self.chemReactants = [{ coeff: "1", formula: "N_2", state: "g", charge: "" }, { coeff: "3", formula: "H_2", state: "g", charge: "" }];
            self.chemArrow = "\\rightleftharpoons";
            self.chemAbove = "\\text{Fe cat.}";
            self.chemBelow = "450^{\\circ}\\text{C},\\; 200\\text{ atm}";
            self.chemProducts = [{ coeff: "2", formula: "NH_3", state: "g", charge: "" }];
            renderChemCards();
          }
        },
        {
          label: "Acid-Base Neutralization (HCl + NaOH → NaCl + H₂O)",
          onPick: function() {
            self.chemReactants = [{ coeff: "1", formula: "HCl", state: "aq", charge: "" }, { coeff: "1", formula: "NaOH", state: "aq", charge: "" }];
            self.chemArrow = "\\rightarrow";
            self.chemAbove = "";
            self.chemBelow = "";
            self.chemProducts = [{ coeff: "1", formula: "NaCl", state: "aq", charge: "" }, { coeff: "1", formula: "H_2O", state: "l", charge: "" }];
            renderChemCards();
          }
        },
        {
          label: "Carbonate Effervescence (CaCO₃ + 2HCl → CaCl₂ + CO₂ + H₂O)",
          onPick: function() {
            self.chemReactants = [{ coeff: "1", formula: "CaCO_3", state: "s", charge: "" }, { coeff: "2", formula: "HCl", state: "aq", charge: "" }];
            self.chemArrow = "\\rightarrow";
            self.chemAbove = "";
            self.chemBelow = "";
            self.chemProducts = [{ coeff: "1", formula: "CaCl_2", state: "aq", charge: "" }, { coeff: "1", formula: "CO_2", state: "g", charge: "" }, { coeff: "1", formula: "H_2O", state: "l", charge: "" }];
            renderChemCards();
          }
        },
        {
          label: "Silver Chloride Precipitation (Ag⁺ + Cl⁻ → AgCl)",
          onPick: function() {
            self.chemReactants = [{ coeff: "1", formula: "Ag", state: "aq", charge: "+" }, { coeff: "1", formula: "Cl", state: "aq", charge: "-" }];
            self.chemArrow = "\\rightarrow";
            self.chemAbove = "";
            self.chemBelow = "";
            self.chemProducts = [{ coeff: "1", formula: "AgCl", state: "s", charge: "" }];
            renderChemCards();
          }
        },
        {
          label: "Copper with Nitric Acid (3Cu + 8HNO₃ → 3Cu(NO₃)₂ + 2NO + 4H₂O)",
          onPick: function() {
            self.chemReactants = [{ coeff: "3", formula: "Cu", state: "s", charge: "" }, { coeff: "8", formula: "HNO_3", state: "aq", charge: "" }];
            self.chemArrow = "\\rightarrow";
            self.chemAbove = "\\text{dilute}";
            self.chemBelow = "";
            self.chemProducts = [{ coeff: "3", formula: "Cu(NO_3)_2", state: "aq", charge: "" }, { coeff: "2", formula: "NO", state: "g", charge: "" }, { coeff: "4", formula: "H_2O", state: "l", charge: "" }];
            renderChemCards();
          }
        },
        {
          label: "Permanganate Redox in Acid (2MnO₄⁻ + 5Fe²⁺ + 8H⁺ → 2Mn²⁺ + 5Fe³⁺ + 4H₂O)",
          onPick: function() {
            self.chemReactants = [{ coeff: "2", formula: "MnO_4", state: "aq", charge: "-" }, { coeff: "5", formula: "Fe", state: "aq", charge: "2+" }, { coeff: "8", formula: "H", state: "aq", charge: "+" }];
            self.chemArrow = "\\rightarrow";
            self.chemAbove = "\\text{acidic}";
            self.chemBelow = "";
            self.chemProducts = [{ coeff: "2", formula: "Mn", state: "aq", charge: "2+" }, { coeff: "5", formula: "Fe", state: "aq", charge: "3+" }, { coeff: "4", formula: "H_2O", state: "l", charge: "" }];
            renderChemCards();
          }
        },
        {
          label: "Photosynthesis (6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂)",
          onPick: function() {
            self.chemReactants = [{ coeff: "6", formula: "CO_2", state: "g", charge: "" }, { coeff: "6", formula: "H_2O", state: "l", charge: "" }];
            self.chemArrow = "\\rightarrow";
            self.chemAbove = "h\\nu";
            self.chemBelow = "\\text{chlorophyll}";
            self.chemProducts = [{ coeff: "1", formula: "C_6H_12O_6", state: "s", charge: "" }, { coeff: "6", formula: "O_2", state: "g", charge: "" }];
            renderChemCards();
          }
        },
        {
          label: "Fischer Esterification (CH₃COOH + C₂H₅OH ⇌ CH₃COOC₂H₅ + H₂O)",
          onPick: function() {
            self.chemReactants = [{ coeff: "1", formula: "CH_3COOH", state: "l", charge: "" }, { coeff: "1", formula: "C_2H_5OH", state: "l", charge: "" }];
            self.chemArrow = "\\rightleftharpoons";
            self.chemAbove = "\\text{conc. }\\mathrm{H_2SO_4}";
            self.chemBelow = "\\Delta";
            self.chemProducts = [{ coeff: "1", formula: "CH_3COOC_2H_5", state: "l", charge: "" }, { coeff: "1", formula: "H_2O", state: "l", charge: "" }];
            renderChemCards();
          }
        },
        {
          label: "Galvanic Daniell Cell (Zn + Cu²⁺ → Zn²⁺ + Cu)",
          onPick: function() {
            self.chemReactants = [{ coeff: "1", formula: "Zn", state: "s", charge: "" }, { coeff: "1", formula: "Cu", state: "aq", charge: "2+" }];
            self.chemArrow = "\\rightarrow";
            self.chemAbove = "";
            self.chemBelow = "";
            self.chemProducts = [{ coeff: "1", formula: "Zn", state: "aq", charge: "2+" }, { coeff: "1", formula: "Cu", state: "s", charge: "" }];
            renderChemCards();
          }
        },
        {
          label: "Hydrogen Peroxide Decomposition (2H₂O₂ → 2H₂O + O₂)",
          onPick: function() {
            self.chemReactants = [{ coeff: "2", formula: "H_2O_2", state: "aq", charge: "" }];
            self.chemArrow = "\\rightarrow";
            self.chemAbove = "\\mathrm{MnO_2}";
            self.chemBelow = "";
            self.chemProducts = [{ coeff: "2", formula: "H_2O", state: "l", charge: "" }, { coeff: "1", formula: "O_2", state: "g", charge: "" }];
            renderChemCards();
          }
        },
        {
          label: "Unbalanced Iron Rusting (Fe + O₂ → Fe₂O₃)",
          onPick: function() {
            self.chemReactants = [{ coeff: "1", formula: "Fe", state: "s", charge: "" }, { coeff: "1", formula: "O_2", state: "g", charge: "" }];
            self.chemArrow = "\\rightarrow";
            self.chemAbove = "\\text{H}_2\\text{O}";
            self.chemBelow = "";
            self.chemProducts = [{ coeff: "1", formula: "Fe_2O_3", state: "s", charge: "" }];
            renderChemCards();
          }
        }
      ]);

      var chemHost = card.createDiv("lt-chem-builder-host");

      var updateChemStatusAndLatex = function() {
        var check = validateAndBalanceChemEquation(self.chemReactants, self.chemProducts, false);
        chemBadgeEl.textContent = check.message;
        chemBadgeEl.className = "lt-slot-status " + (check.balanced ? "is-valid" : "is-invalid");

        var formatSide = function(list) {
          return list.map(function(mol) {
            var c = (mol.coeff && String(mol.coeff).trim() !== "" && String(mol.coeff).trim() !== "1") ? String(mol.coeff).trim() + "\\," : "";
            var normFormula = normalizeChemicalFormulaInput(mol.formula || "H_2O");
            var f = "\\mathrm{" + normFormula + "}";
            var ch = mol.charge ? "^{" + mol.charge + "}" : "";
            var st = mol.state ? "_{(\\mathrm{" + mol.state + "})}" : "";
            return c + f + ch + st;
          }).join(" + ");
        };

        var arrowStr = self.chemArrow;
        var abv = (self.chemAbove || "").trim();
        var blw = (self.chemBelow || "").trim();

        if (abv || blw) {
          if (arrowStr === "\\rightarrow") {
            arrowStr = "\\xrightarrow" + (blw ? "[" + blw + "]" : "") + "{" + abv + "}";
          } else {
            var coreArr = arrowStr;
            if (abv) coreArr = "\\overset{" + abv + "}{" + coreArr + "}";
            if (blw) coreArr = "\\underset{" + blw + "}{" + coreArr + "}";
            arrowStr = coreArr;
          }
        }

        var full = formatSide(self.chemReactants) + " " + arrowStr + " " + formatSide(self.chemProducts);
        self.activeTemplate = full;
        self.slots = [];
        self.syncSlotsToTextarea();
        self.renderTokenOverlay();
        self.updatePreview();
      };

      renderChemCards = function() {
        chemHost.empty();

        // Row 1: Balance / Unbalance & Arrow Controls
        var actionRow = chemHost.createDiv("lt-chem-action-bar");
        var balanceBtn = actionRow.createEl("button", {
          text: "⚖️ Auto-Balance",
          cls: "mod-cta lt-compact-btn"
        });
        balanceBtn.type = "button";
        self.comp.registerDomEvent(balanceBtn, "click", function() {
          var res = validateAndBalanceChemEquation(self.chemReactants, self.chemProducts, true);
          renderChemCards();
          new obsidian.Notice(res.message);
        });

        var unbalanceBtn = actionRow.createEl("button", {
          text: "🔄 Unbalance / Clear Coeffs",
          cls: "lt-compact-btn",
          attr: { title: "Reset all stoichiometric coefficients to 1 (unbalanced)" }
        });
        unbalanceBtn.type = "button";
        self.comp.registerDomEvent(unbalanceBtn, "click", function() {
          self.chemReactants.forEach(function(m) { m.coeff = ""; });
          self.chemProducts.forEach(function(m) { m.coeff = ""; });
          renderChemCards();
        });

        var arrSel = actionRow.createEl("select", { cls: "dropdown lt-compact-dropdown" });
        [
          { v: "\\rightarrow", t: "Arrow: → Forward" },
          { v: "\\rightleftharpoons", t: "Arrow: ⇌ Equilibrium" },
          { v: "\\leftrightarrow", t: "Arrow: ↔ Resonance" }
        ].forEach(function(a) {
          var o = arrSel.createEl("option", { value: a.v, text: a.t });
          if (self.chemArrow === a.v) o.selected = true;
        });

        // Row 2: Above & Below Arrow Inputs + Quick Condition Chips
        var arrowCondRow = chemHost.createDiv("lt-chem-arrow-cond-row");
        arrowCondRow.createSpan({ text: "Above Arrow:", cls: "lt-subtitle" });
        var abvInp = arrowCondRow.createEl("input", {
          cls: "lt-slot-input",
          attr: { type: "text", value: self.chemAbove, placeholder: "e.g. \\Delta, h\\nu, \\text{Pt}" }
        });

        arrowCondRow.createSpan({ text: "Below Arrow:", cls: "lt-subtitle" });
        var blwInp = arrowCondRow.createEl("input", {
          cls: "lt-slot-input",
          attr: { type: "text", value: self.chemBelow, placeholder: "e.g. \\text{H}_2\\text{O}, 450^{\\circ}\\text{C}" }
        });

        var quickPresets = [
          { label: "+ Δ (Heat)", abv: "\\Delta" },
          { label: "+ hν (Light)", abv: "h\\nu" },
          { label: "+ Pt / Δ", abv: "\\text{Pt}", blw: "\\Delta" },
          { label: "+ H⁺ / H₂O", abv: "\\mathrm{H^+}", blw: "\\mathrm{H_2O}" }
        ];
        quickPresets.forEach(function(qp) {
          var qBtn = arrowCondRow.createEl("button", { text: qp.label, cls: "lt-subtopic-chip" });
          qBtn.type = "button";
          self.comp.registerDomEvent(qBtn, "click", function() {
            if (qp.abv !== undefined) { self.chemAbove = qp.abv; abvInp.value = qp.abv; }
            if (qp.blw !== undefined) { self.chemBelow = qp.blw; blwInp.value = qp.blw; }
            updateChemStatusAndLatex();
          });
        });

        self.comp.registerDomEvent(arrSel, "change", function() { self.chemArrow = arrSel.value; updateChemStatusAndLatex(); });
        self.comp.registerDomEvent(abvInp, "input", function() { self.chemAbove = abvInp.value; updateChemStatusAndLatex(); });
        self.comp.registerDomEvent(blwInp, "input", function() { self.chemBelow = blwInp.value; updateChemStatusAndLatex(); });

        var layout = chemHost.createDiv("lt-chem-two-col");

        var renderMoleculeZone = function(title, arr) {
          var zone = layout.createDiv("lt-chem-zone");
          var zHead = zone.createDiv("lt-chem-zone-head");
          zHead.createSpan({ text: title, cls: "lt-section-label" });
          var addBtn = zHead.createEl("button", { text: "+ Add Species", cls: "lt-subtopic-chip" });
          addBtn.type = "button";
          self.comp.registerDomEvent(addBtn, "click", function() {
            arr.push({ coeff: "", formula: "H_2O", state: "aq", charge: "" });
            renderChemCards();
          });

          arr.forEach(function(mol, idx) {
            var mCard = zone.createDiv("lt-chem-mol-card");
            var cInp = mCard.createEl("input", {
              cls: "lt-slot-input lt-chem-coeff",
              attr: { type: "text", value: mol.coeff, placeholder: "Coeff", title: "Stoichiometric Coefficient" }
            });
            var fInp = mCard.createEl("input", {
              cls: "lt-slot-input lt-chem-formula",
              attr: { type: "text", value: mol.formula, placeholder: "Formula (e.g. ph4, NaCl)", title: "Formula (auto-capitalizes & subscripts)" }
            });
            var chInp = mCard.createEl("input", {
              cls: "lt-slot-input lt-chem-charge",
              attr: { type: "text", value: mol.charge, placeholder: "Charge", title: "Ion Charge (e.g. 2+, -)" }
            });
            var stSel = mCard.createEl("select", { cls: "dropdown lt-compact-dropdown lt-chem-state" });
            [
              { v: "", t: "state" },
              { v: "aq", t: "(aq)" },
              { v: "s", t: "(s)" },
              { v: "l", t: "(l)" },
              { v: "g", t: "(g)" }
            ].forEach(function(s) {
              var o = stSel.createEl("option", { value: s.v, text: s.t });
              if (mol.state === s.v) o.selected = true;
            });

            var delBtn = mCard.createEl("button", { text: "✕", cls: "lt-step-del-btn" });
            delBtn.type = "button";

            self.comp.registerDomEvent(cInp, "input", function() { mol.coeff = cInp.value; updateChemStatusAndLatex(); });
            self.comp.registerDomEvent(fInp, "input", function() { mol.formula = fInp.value; updateChemStatusAndLatex(); });
            self.comp.registerDomEvent(fInp, "blur", function() {
              var norm = normalizeChemicalFormulaInput(fInp.value);
              fInp.value = norm;
              mol.formula = norm;
              updateChemStatusAndLatex();
            });
            self.comp.registerDomEvent(chInp, "input", function() { mol.charge = chInp.value; updateChemStatusAndLatex(); });
            self.comp.registerDomEvent(stSel, "change", function() { mol.state = stSel.value; updateChemStatusAndLatex(); });
            self.comp.registerDomEvent(delBtn, "click", function() {
              if (arr.length <= 1) return;
              arr.splice(idx, 1);
              renderChemCards();
            });
          });
        };

        renderMoleculeZone("1. Reactants", self.chemReactants);
        renderMoleculeZone("2. Products", self.chemProducts);
        updateChemStatusAndLatex();
      };

      renderChemCards();
    }

    // 5. ELECTRICAL ENGINEERING COMPLETE FORMALIZATIONS WORKBENCH (All 8 EE Subfields!)
    else if (this.activeWizard === "ee_phasor") {
      createWizHeader("⚡ Electrical Engineering Formalizations Workbench (All 8 Subfields)", null, []);
      var rowEE = card.createDiv("lt-wizard-controls");

      rowEE.createSpan({ text: "EE Subfield:", cls: "lt-subtitle" });
      var subSel = rowEE.createEl("select", { cls: "dropdown lt-compact-dropdown" });
      Object.keys(EE_FORMALIZATIONS).forEach(function(k) {
        var o = subSel.createEl("option", { value: k, text: EE_FORMALIZATIONS[k].label });
        if (self.eeSubfieldKey === k) o.selected = true;
      });

      rowEE.createSpan({ text: "Formalization:", cls: "lt-subtitle" });
      var tplSel = rowEE.createEl("select", { cls: "dropdown lt-compact-dropdown" });

      var chipsRow = card.createDiv("lt-domain-grid");

      var populateEETemplates = function() {
        tplSel.empty();
        chipsRow.empty();
        var group = EE_FORMALIZATIONS[self.eeSubfieldKey] || EE_FORMALIZATIONS.dc_ac_circuits;
        group.templates.forEach(function(t, idx) {
          var o = tplSel.createEl("option", { value: String(idx), text: t.name });
          if (idx === self.eeTemplateIdx) o.selected = true;

          var chip = chipsRow.createEl("button", {
            cls: "lt-topic-chip lt-compact-pill",
            text: t.name
          });
          chip.type = "button";
          chip.setAttr("aria-pressed", String(idx === self.eeTemplateIdx));
          self.comp.registerDomEvent(chip, "click", function() {
            self.eeTemplateIdx = idx;
            populateEETemplates();
            self.loadTemplateIntoSlots(t.latex, false);
          });
        });

        var currentTpl = group.templates[self.eeTemplateIdx] || group.templates[0];
        if (currentTpl) self.loadTemplateIntoSlots(currentTpl.latex, false);
      };

      this.comp.registerDomEvent(subSel, "change", function() {
        self.eeSubfieldKey = subSel.value;
        self.eeTemplateIdx = 0;
        self.activeTopic = self.eeSubfieldKey;
        self.renderDirectoryFilter();
        self.renderScopedPalette();
        populateEETemplates();
      });

      this.comp.registerDomEvent(tplSel, "change", function() {
        self.eeTemplateIdx = Number(tplSel.value);
        populateEETemplates();
      });

      populateEETemplates();
    }

    // 6. SERIES & PRODUCT
    else if (this.activeWizard === "series") {
      createWizHeader("Series (∑) & Product (∏) Builder", null, [
        { label: "Taylor Series", latex: "\\sum_{${1:n=0}}^{${2:\\infty}} \\frac{f^{(n)}(${3:a})}{n!}(x - ${3:a})^n" },
        { label: "Discrete Fourier Transform", latex: "X[k] = \\sum_{${1:n=0}}^{${2:N-1}} ${3:x[n]}\\,e^{-j\\frac{2\\pi}{N}kn}" }
      ]);
      var rowS = card.createDiv("lt-wizard-controls");
      var opSel = rowS.createEl("select", { cls: "dropdown lt-compact-dropdown" });
      opSel.createEl("option", { value: "\\sum", text: "∑ Summation" });
      opSel.createEl("option", { value: "\\prod", text: "∏ Product" });
      var applySeries = function() {
        self.loadTemplateIntoSlots(opSel.value + "_{${1:n=1}}^{${2:\\infty}} \\left( ${3:a_n} \\right)", false);
      };
      this.comp.registerDomEvent(opSel, "change", applySeries);
      applySeries();
    }

    // 7. LIMIT
    else if (this.activeWizard === "limit") {
      createWizHeader("Limit Builder", null, [
        { label: "Derivative Limit Definition", latex: "f'(x) = \\lim_{${1:h} \\to ${2:0}} \\frac{f(x + ${1:h}) - f(x)}{${1:h}}" },
        { label: "Final Value Theorem", latex: "\\lim_{t \\to \\infty} y(t) = \\lim_{${1:s} \\to ${2:0}} s\\,Y(s)" }
      ]);
      var rowL = card.createDiv("lt-wizard-controls");
      var dirSel = rowL.createEl("select", { cls: "dropdown lt-compact-dropdown" });
      dirSel.createEl("option", { value: "", text: "x → a (Two-sided)" });
      dirSel.createEl("option", { value: "^{+}", text: "x → a⁺ (Right)" });
      dirSel.createEl("option", { value: "^{-}", text: "x → a⁻ (Left)" });
      var applyLim = function() {
        self.loadTemplateIntoSlots("\\lim_{${1:x} \\to ${2:0}" + dirSel.value + "} \\left( ${3:f(x)} \\right)", false);
      };
      this.comp.registerDomEvent(dirSel, "change", applyLim);
      applyLim();
    }

    // 8. PIECEWISE
    else if (this.activeWizard === "piecewise") {
      var renderPiecewise;
      createWizHeader("Piecewise Function (cases) Builder", null, [
        {
          label: "Unit Step u(t)",
          onPick: function() {
            self.piecewiseFunc = "u(t)";
            self.piecewiseRows = [{ expr: "1", cond: "t \\ge 0" }, { expr: "0", cond: "t < 0" }];
            renderPiecewise();
          }
        }
      ]);
      var pwHost = card.createDiv();
      renderPiecewise = function() {
        pwHost.empty();
        var topRow = pwHost.createDiv("lt-wizard-controls");
        var fnInp = topRow.createEl("input", { cls: "lt-slot-input", attr: { type: "text", value: self.piecewiseFunc, placeholder: "f(x)" } });
        var addBranchBtn = topRow.createEl("button", { text: "+ Add Branch", cls: "lt-subtopic-chip" });
        addBranchBtn.type = "button";

        var syncPW = function() {
          var lines = self.piecewiseRows.map(function(r, i) {
            return "  ${" + (i * 2 + 2) + ":" + (r.expr || "0") + "}, & ${" + (i * 2 + 3) + ":" + (r.cond || "\\text{otherwise}") + "}";
          });
          self.loadTemplateIntoSlots("${1:" + (self.piecewiseFunc || "f(x)") + "} = \\begin{cases}\n" + lines.join(" \\\\\n") + "\n\\end{cases}", false);
        };

        self.comp.registerDomEvent(fnInp, "input", function() { self.piecewiseFunc = fnInp.value; syncPW(); });
        self.comp.registerDomEvent(addBranchBtn, "click", function() {
          self.piecewiseRows.push({ expr: "0", cond: "\\text{otherwise}" });
          renderPiecewise();
        });

        self.piecewiseRows.forEach(function(rowObj, idx) {
          var rDiv = pwHost.createDiv("lt-solver-step-row");
          rDiv.createSpan({ text: "Case " + (idx + 1), cls: "lt-solver-step-num" });
          var eInp = rDiv.createEl("input", { cls: "lt-slot-input", attr: { type: "text", value: rowObj.expr } });
          rDiv.createSpan({ text: "if", cls: "lt-subtitle" });
          var cInp = rDiv.createEl("input", { cls: "lt-slot-input", attr: { type: "text", value: rowObj.cond } });
          var dBtn = rDiv.createEl("button", { text: "✕", cls: "lt-step-del-btn" });
          dBtn.type = "button";
          self.comp.registerDomEvent(eInp, "input", function() { rowObj.expr = eInp.value; syncPW(); });
          self.comp.registerDomEvent(cInp, "input", function() { rowObj.cond = cInp.value; syncPW(); });
          self.comp.registerDomEvent(dBtn, "click", function() {
            if (self.piecewiseRows.length <= 1) return;
            self.piecewiseRows.splice(idx, 1);
            renderPiecewise();
          });
        });
        syncPW();
      };
      renderPiecewise();
    }

    // 9. VECTOR & DEL
    else if (this.activeWizard === "vector") {
      createWizHeader("Vector & Del (∇ Grad / Div / Curl) Builder", null, [
        { label: "3D Cartesian Vector", latex: "\\mathbf{${1:A}} = ${2:A_x}\\hat{i} + ${3:A_y}\\hat{j} + ${4:A_z}\\hat{k}" }
      ]);
      var rowV = card.createDiv("lt-wizard-controls");
      var vecMode = rowV.createEl("select", { cls: "dropdown lt-compact-dropdown" });
      vecMode.createEl("option", { value: "ijk", text: "3D Unit Vector (Ax î + Ay ĵ + Az k̂)" });
      vecMode.createEl("option", { value: "dot", text: "Dot Product (A · B)" });
      vecMode.createEl("option", { value: "cross", text: "Cross Product (A × B)" });
      vecMode.createEl("option", { value: "grad", text: "Gradient (∇f)" });
      vecMode.createEl("option", { value: "div", text: "Divergence (∇ · F)" });
      vecMode.createEl("option", { value: "curl", text: "Curl (∇ × F)" });

      var applyVec = function() {
        var m = vecMode.value;
        var tpl = "\\mathbf{${1:v}} = ${2:v_x}\\hat{i} + ${3:v_y}\\hat{j} + ${4:v_z}\\hat{k}";
        if (m === "dot") tpl = "\\mathbf{${1:A}} \\cdot \\mathbf{${2:B}} = |\\mathbf{${1:A}}|\\,|\\mathbf{${2:B}}|\\cos(${3:\\theta})";
        else if (m === "cross") tpl = "\\mathbf{${1:A}} \\times \\mathbf{${2:B}} = |\\mathbf{${1:A}}|\\,|\\mathbf{${2:B}}|\\sin(${3:\\theta})\\,\\hat{n}";
        else if (m === "grad") tpl = "\\nabla ${1:f} = \\frac{\\partial ${1:f}}{\\partial x}\\hat{i} + \\frac{\\partial ${1:f}}{\\partial y}\\hat{j} + \\frac{\\partial ${1:f}}{\\partial z}\\hat{k}";
        else if (m === "div") tpl = "\\nabla \\cdot \\mathbf{${1:F}} = \\frac{\\partial ${2:F_x}}{\\partial x} + \\frac{\\partial ${3:F_y}}{\\partial y} + \\frac{\\partial ${4:F_z}}{\\partial z}";
        else if (m === "curl") tpl = "\\nabla \\times \\mathbf{${1:F}} = \\begin{vmatrix} \\hat{i} & \\hat{j} & \\hat{k} \\\\ \\partial_x & \\partial_y & \\partial_z \\\\ ${2:F_x} & ${3:F_y} & ${4:F_z} \\end{vmatrix}";
        self.loadTemplateIntoSlots(tpl, false);
      };
      this.comp.registerDomEvent(vecMode, "change", applyVec);
      applyVec();
    }

    // 10. 4-CORNER ISOTOPE & SUB/SUPERSCRIPT
    else if (this.activeWizard === "corner4") {
      createWizHeader("4-Corner Isotope, Ion & Sub/Superscript Builder", null, [
        { label: "Uranium-235 Isotope", latex: "{}^{235}_{92}\\mathrm{U}" },
        { label: "Sulfate Ion SO₄²⁻", latex: "\\mathrm{SO}_{4}^{2-}" }
      ]);
      var cGrid = card.createDiv("lt-corner4-grid");
      var tl = cGrid.createEl("input", { cls: "lt-slot-input", attr: { type: "text", value: "235", placeholder: "Top-Left (A)" } });
      var center = cGrid.createEl("input", { cls: "lt-slot-input lt-corner-center", attr: { type: "text", value: "\\mathrm{U}", placeholder: "Symbol" } });
      var tr = cGrid.createEl("input", { cls: "lt-slot-input", attr: { type: "text", value: "", placeholder: "Top-Right (^)" } });
      var bl = cGrid.createEl("input", { cls: "lt-slot-input", attr: { type: "text", value: "92", placeholder: "Bottom-Left (Z)" } });
      cGrid.createDiv();
      var br = cGrid.createEl("input", { cls: "lt-slot-input", attr: { type: "text", value: "", placeholder: "Bottom-Right (_)" } });

      var syncCorners = function() {
        var leftPart = (tl.value || bl.value) ? "{}^{" + tl.value + "}_{" + bl.value + "}" : "";
        var rightSup = tr.value ? "^{" + tr.value + "}" : "";
        var rightSub = br.value ? "_{" + br.value + "}" : "";
        self.loadTemplateIntoSlots(leftPart + (center.value || "X") + rightSub + rightSup, false);
      };
      [tl, tr, bl, br, center].forEach(function(el) {
        self.comp.registerDomEvent(el, "input", syncCorners);
      });
      syncCorners();
    }
  }

  loadTemplateIntoSlots(templateStr, autoDetect) {
    var extracted = extractTemplateSlots(templateStr, autoDetect);
    this.activeTemplate = extracted.template;
    this.slots = extracted.slots;
    this.activeSlotId = this.slots.length > 0 ? this.slots[0].id : null;
    this.rawCursorHighlight = false;
    this.syncSlotsToTextarea();
    this.renderProtectedSlots();
    this.renderTokenOverlay();
    this.updatePreview();
  }

  syncSlotsToTextarea() {
    var compiled = compileTemplateWithSlots(this.activeTemplate, this.slots, null);
    this.currentLatex = compiled;
    if (this.inputEl) {
      this.inputEl.value = compiled;
      this.validateRawLatex();
    }
  }

  renderTokenOverlay() {
    if (!this.tokenOverlayEl) return;
    this.tokenOverlayEl.empty();
    var self = this;

    if (!this.slots || this.slots.length === 0) {
      this.tokenOverlayEl.createSpan({
        text: "Tip: Move cursor inside any { } in LaTeX Code to highlight in preview, or click '🔒 Auto-Lock { } into Valid Slots'.",
        cls: "lt-subtitle"
      });
      return;
    }

    this.tokenOverlayEl.createSpan({ text: "Tokens:", cls: "lt-token-map-label" });
    this.slots.forEach(function(slot, idx) {
      var chip = self.tokenOverlayEl.createEl("button", {
        cls: "lt-token-chip" + (self.activeSlotId === slot.id ? " is-active" : ""),
        text: "#" + slot.id + " " + (slot.role || "Expr") + ": " + (slot.value || slot.label)
      });
      chip.type = "button";
      self.comp.registerDomEvent(chip, "mouseenter", function() {
        self.activeSlotId = slot.id;
        self.rawCursorHighlight = false;
        self.updatePreview();
      });
      self.comp.registerDomEvent(chip, "click", function() {
        self.activeSlotId = slot.id;
        self.rawCursorHighlight = false;
        if (self.slotInputElements && self.slotInputElements[idx]) {
          self.slotInputElements[idx].focus();
        } else {
          self.renderTokenOverlay();
          self.updatePreview();
        }
      });
    });
  }

  renderProtectedSlots() {
    if (!this.slotSection) return;
    this.slotSection.empty();
    var self = this;
    this.slotInputElements = [];

    if (this.activeWizard === "matrix" || this.activeWizard === "chemistry") {
      this.slotSection.addClass("is-hidden");
      return;
    }
    this.slotSection.removeClass("is-hidden");

    if (!this.slots || this.slots.length === 0) {
      this.slotSection.createDiv({
        text: "Tip: Click any formula chip above or click '🔒 Auto-Lock { } into Valid Slots' to cycle through valid input fields with Enter / Arrow Keys.",
        cls: "lt-slot-empty-hint"
      });
      return;
    }

    var titleRow = this.slotSection.createDiv("lt-slot-header-row");
    titleRow.createSpan({
      text: "Protected Input Fields (Enter / Arrow Keys switch fields · '_' and '^' auto-close _{} and ^{} · Triggers autocomplete):",
      cls: "lt-section-label"
    });

    var grid = this.slotSection.createDiv("lt-slot-pill-grid");

    this.slots.forEach(function(slot, idx) {
      var pill = grid.createDiv("lt-slot-pill");
      if (self.activeSlotId === slot.id) pill.addClass("is-active");

      var top = pill.createDiv("lt-slot-pill-top");
      top.createSpan({ text: "#" + slot.id + " · " + (slot.role || "Expr"), cls: "lt-slot-label" });
      var badge = top.createSpan({ text: "✓ Valid", cls: "lt-slot-status is-valid" });

      var inp = pill.createEl("input", {
        cls: "lt-slot-input",
        attr: { type: "text", value: slot.value, placeholder: slot.label }
      });
      self.slotInputElements.push(inp);

      var refreshBadge = function() {
        var check = validateSlotValue(slot.value);
        badge.setText(check.valid ? "✓ Valid" : "⚠ " + check.reason);
        badge.toggleClass("is-valid", check.valid);
        badge.toggleClass("is-invalid", !check.valid);
        pill.toggleClass("is-invalid", !check.valid);
      };
      refreshBadge();

      attachSmartMathInputBehaviors(self.comp, inp, self.plugin, function(newVal) {
        slot.value = newVal;
        self.rawCursorHighlight = false;
        refreshBadge();
        self.syncSlotsToTextarea();
        self.renderTokenOverlay();
        self.scheduleUpdate();
      });

      self.comp.registerDomEvent(inp, "focus", function() {
        self.activeSlotId = slot.id;
        self.rawCursorHighlight = false;
        Array.from(grid.children).forEach(function(c, cIdx) {
          c.toggleClass("is-active", cIdx === idx);
        });
        inp.select();
        self.renderTokenOverlay();
        self.updatePreview();
      });

      self.comp.registerDomEvent(pill, "mouseenter", function() {
        self.activeSlotId = slot.id;
        self.rawCursorHighlight = false;
        self.updatePreview();
      });

      self.comp.registerDomEvent(inp, "input", function() {
        slot.value = inp.value;
        self.rawCursorHighlight = false;
        refreshBadge();
        self.syncSlotsToTextarea();
        self.renderTokenOverlay();
        self.scheduleUpdate();
      });

      self.comp.registerDomEvent(inp, "keydown", function(e) {
        if (e.key === "Enter" || (e.key === "ArrowRight" && inp.selectionEnd === inp.value.length)) {
          e.preventDefault();
          if (idx + 1 < self.slotInputElements.length) self.slotInputElements[idx + 1].focus();
          else self.slotInputElements[0].focus();
        } else if (e.key === "ArrowLeft" && inp.selectionStart === 0) {
          e.preventDefault();
          if (idx - 1 >= 0) self.slotInputElements[idx - 1].focus();
          else self.slotInputElements[self.slotInputElements.length - 1].focus();
        }
      });
    });
  }

  handleBuilderAutocomplete() {
    var val = this.inputEl.value;
    var cursor = this.inputEl.selectionStart;
    var before = val.slice(0, cursor);
    var match = before.match(/(?:^|[\s({[+-])([a-zA-Z0-9/_+\-=]{2,24})$/);
    if (!match) {
      this.acDropdown.addClass("is-hidden");
      this.acItems = [];
      return;
    }

    var q = match[1].toLowerCase();
    this.acQueryRange = { start: cursor - match[1].length, end: cursor };
    var self = this;

    var pool = [];
    if (this.plugin.fastSearchFormulas) {
      pool = this.plugin.fastSearchFormulas(q, 8, this.domain);
    } else {
      pool = [].concat(
        this.plugin.settings.customShortcuts || [],
        this.plugin.settings.customSnippets || [],
        this.plugin.settings.customTemplates || []
      ).filter(function(x) {
        return x.enabled !== false && itemMatchesQuery(x, q);
      }).slice(0, 8);
    }

    this.acItems = pool;
    this.acIndex = 0;

    if (this.acItems.length === 0) {
      this.acDropdown.addClass("is-hidden");
      return;
    }
    this.renderBuilderAutocomplete();
  }

  renderBuilderAutocomplete() {
    this.acDropdown.empty();
    this.acDropdown.removeClass("is-hidden");
    var self = this;

    this.acItems.forEach(function(item, idx) {
      var row = self.acDropdown.createDiv("lt-ac-row");
      if (idx === self.acIndex) row.addClass("is-selected");
      var left = row.createDiv();
      left.createSpan({ text: item.name || item.trigger, cls: "lt-ac-name" });
      var aliasText = (item.aliases && item.aliases.length) ? " (" + [item.trigger].concat(item.aliases).join(", ") + ")" : " (" + item.trigger + ")";
      left.createSpan({ text: aliasText, cls: "lt-ac-trig" });
      row.createEl("code", { text: (item.latex || item.replacement || "").slice(0, 42), cls: "lt-ac-code" });

      self.comp.registerDomEvent(row, "mousedown", function(e) {
        e.preventDefault();
        self.applyBuilderAutocompleteItem(item);
      });
    });
  }

  handleAutocompleteKeydown(e) {
    if (this.acDropdown.hasClass("is-hidden") || !this.acItems || this.acItems.length === 0) return false;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      this.acIndex = (this.acIndex + 1) % this.acItems.length;
      this.renderBuilderAutocomplete();
      return true;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      this.acIndex = (this.acIndex - 1 + this.acItems.length) % this.acItems.length;
      this.renderBuilderAutocomplete();
      return true;
    }
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      this.applyBuilderAutocompleteItem(this.acItems[this.acIndex]);
      return true;
    }
    if (e.key === "Escape") {
      this.acDropdown.addClass("is-hidden");
      return true;
    }
    return false;
  }

  applyBuilderAutocompleteItem(item) {
    this.acDropdown.addClass("is-hidden");
    var val = this.inputEl.value;
    var r = this.acQueryRange;
    var code = item.latex || item.replacement || "";
    var combined = val.slice(0, r.start) + code + val.slice(r.end);
    this.loadTemplateIntoSlots(combined, true);
  }

  validateRawLatex() {
    var check = validateSlotValue(this.inputEl.value);
    if (!this.syntaxBadge) return;
    this.syntaxBadge.setText(check.valid ? "✓ Syntax Valid" : "⚠ " + check.reason);
    this.syntaxBadge.toggleClass("is-valid", check.valid);
    this.syntaxBadge.toggleClass("is-invalid", !check.valid);
  }

  scheduleUpdate() {
    if (!this.plugin.settings.livePreview) return;
    if (this.updateTimer) window.clearTimeout(this.updateTimer);
    var self = this;
    this.updateTimer = window.setTimeout(function() {
      self.updateTimer = null;
      self.updatePreview();
    }, 75);
  }

  async updatePreview() {
    this.renderComponent.unload();
    this.renderComponent = new obsidian.Component();
    this.renderComponent.load();
    this.previewEl.empty();

    var code = "";
    if (!this.rawCursorHighlight && this.slots && this.slots.length > 0) {
      code = compileTemplateWithSlots(this.activeTemplate, this.slots, this.activeSlotId);
    } else if (this.inputEl) {
      var raw = this.inputEl.value;
      code = this.rawCursorHighlight
        ? highlightRawLatexAtCursor(raw, this.inputEl.selectionStart)
        : raw.trim();
    }

    if (!code || !code.trim()) {
      this.previewEl.createDiv({ text: "Rendered math will appear here.", cls: "lt-preview-empty" });
      return;
    }

    try {
      await obsidian.MarkdownRenderer.render(
        this.app,
        wrapMath(code, "block"),
        this.previewEl,
        this.app.workspace.getActiveFile() ? this.app.workspace.getActiveFile().path : "",
        this.renderComponent
      );
    } catch (e) {
      this.previewEl.createEl("code", { text: code });
    }
  }

  async insertIntoNote() {
    var raw = this.inputEl.value.trim();
    if (!raw) {
      new obsidian.Notice("Please enter a LaTeX formula.");
      return;
    }
    var finalLatex = wrapMath(raw, this.plugin.settings.wrapStyle);
    if (this.editor.somethingSelected()) {
      this.editor.replaceSelection(finalLatex);
    } else {
      this.editor.replaceRange(finalLatex, this.editor.getCursor());
    }
    if (this.plugin.settings.enableHistory) {
      await this.plugin.recordHistory(raw, this.domain);
    }
    this.close();
  }

  onClose() {
    if (this.plugin.activeBuilderModal === this) {
      this.plugin.activeBuilderModal = null;
    }
    if (this.updateTimer) window.clearTimeout(this.updateTimer);
    this.comp.unload();
    this.renderComponent.unload();
    this.contentEl.empty();
  }
}

// ============================================================================
// 10. HIGH-PERFORMANCE LIBRARY MANAGER MODAL
// ============================================================================
class LibraryManagerModal extends obsidian.Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
    this.activeTab = "snippets";
    this.selectedDomains = [];
    this.selectedTopic = "all";
    this.searchQuery = "";
    this.visibleLimit = 40;
    this.comp = new obsidian.Component();
  }

  onOpen() {
    this.comp.load();
    this.modalEl.addClass("latex-toolbox-library-modal");
    this.modalEl.setAttr("data-ui-scale", this.plugin.settings.uiScale || "115");
    this.render();
  }

  render() {
    var contentEl = this.contentEl;
    contentEl.empty();
    var self = this;

    contentEl.createEl("h2", { text: "STEM Curriculum & Formula Library Manager" });
    contentEl.createDiv({
      text: "Multi-subject filter, cascading directory branches, lazy-loaded list, and multi-file JSON pack merger.",
      cls: "lt-subtitle"
    });

    var topBar = contentEl.createDiv("lt-library-topbar");
    var tabs = topBar.createDiv("lt-domain-grid");
    ["snippets", "shortcuts", "templates"].forEach(function(tab) {
      var btn = tabs.createEl("button", {
        text: tab.charAt(0).toUpperCase() + tab.slice(1),
        cls: "lt-library-tab"
      });
      btn.type = "button";
      btn.setAttr("aria-pressed", String(self.activeTab === tab));
      self.comp.registerDomEvent(btn, "click", function() {
        self.activeTab = tab;
        self.visibleLimit = 40;
        self.render();
      });
    });

    var toolbar = topBar.createDiv("lt-library-toolbar");
    var addBtn = toolbar.createEl("button", { text: "+ Add " + this.activeTab.slice(0, -1), cls: "mod-cta" });
    addBtn.type = "button";
    this.comp.registerDomEvent(addBtn, "click", function() { self.addItem(); });

    var importBtn = toolbar.createEl("button", { text: "Import & Merge JSON Pack(s)" });
    importBtn.type = "button";
    this.comp.registerDomEvent(importBtn, "click", function() { self.importMultipleLibraries(); });

    var exportBtn = toolbar.createEl("button", { text: "Export JSON" });
    exportBtn.type = "button";
    this.comp.registerDomEvent(exportBtn, "click", function() { self.exportLibrary(); });

    var filterBox = contentEl.createDiv("lt-tree-container");
    var subjRow = filterBox.createDiv("lt-tree-row");
    subjRow.createSpan({ text: "Subjects:", cls: "lt-tree-label" });
    var subjChips = subjRow.createDiv("lt-domain-grid");

    var allBtn = subjChips.createEl("button", { cls: "lt-domain-button lt-compact-pill", text: "All Subjects" });
    allBtn.type = "button";
    allBtn.setAttr("aria-pressed", String(this.selectedDomains.length === 0));
    this.comp.registerDomEvent(allBtn, "click", function() {
      self.selectedDomains = [];
      self.selectedTopic = "all";
      self.visibleLimit = 40;
      self.render();
    });

    Object.keys(TAXONOMY).forEach(function(dKey) {
      var isSel = self.selectedDomains.indexOf(dKey) !== -1;
      var dBtn = subjChips.createEl("button", {
        cls: "lt-domain-button lt-compact-pill",
        text: TAXONOMY[dKey].icon + " " + TAXONOMY[dKey].label
      });
      dBtn.type = "button";
      dBtn.setAttr("aria-pressed", String(isSel));
      self.comp.registerDomEvent(dBtn, "click", function() {
        if (isSel) self.selectedDomains = self.selectedDomains.filter(function(x) { return x !== dKey; });
        else self.selectedDomains.push(dKey);
        self.selectedTopic = "all";
        self.visibleLimit = 40;
        self.render();
      });
    });

    if (this.selectedDomains.length === 1 && TAXONOMY[this.selectedDomains[0]]) {
      var singleDom = TAXONOMY[this.selectedDomains[0]];
      var topicRow = filterBox.createDiv("lt-tree-row");
      topicRow.createSpan({ text: "Branch:", cls: "lt-tree-label" });
      var tWrap = topicRow.createDiv("lt-domain-grid");

      var allT = tWrap.createEl("button", { cls: "lt-topic-chip lt-compact-pill", text: "All Branches" });
      allT.type = "button";
      allT.setAttr("aria-pressed", String(this.selectedTopic === "all"));
      this.comp.registerDomEvent(allT, "click", function() {
        self.selectedTopic = "all";
        self.visibleLimit = 40;
        self.render();
      });

      Object.keys(singleDom.topics).forEach(function(tKey) {
        var tBtn = tWrap.createEl("button", { cls: "lt-topic-chip lt-compact-pill", text: singleDom.topics[tKey].label });
        tBtn.type = "button";
        tBtn.setAttr("aria-pressed", String(self.selectedTopic === tKey));
        self.comp.registerDomEvent(tBtn, "click", function() {
          self.selectedTopic = tKey;
          self.visibleLimit = 40;
          self.render();
        });
      });
    }

    var searchInput = contentEl.createEl("input", {
      cls: "lt-quick-search",
      attr: { type: "search", placeholder: "Search by name, trigger, alias, topic, or LaTeX...", value: this.searchQuery }
    });

    var countLabel = contentEl.createDiv({ cls: "lt-subtitle" });
    var listEl = contentEl.createDiv("lt-library-list");

    var currentFiltered = [];
    var renderedCount = 0;
    var pageSize = 30;

    var appendRow = function(item) {
      var row = listEl.createDiv("lt-library-row");
      var toggle = row.createEl("input", { attr: { type: "checkbox" } });
      toggle.checked = item.enabled !== false;
      self.comp.registerDomEvent(toggle, "change", function() {
        item.enabled = toggle.checked;
        self.plugin.saveSettings();
      });

      var info = row.createDiv();
      var titleLine = info.createDiv("lt-library-name-row");
      titleLine.createSpan({ text: item.name || item.label || item.trigger, cls: "lt-library-name" });
      if (item.domain) titleLine.createSpan({ text: item.domain, cls: "lt-badge" });
      if (item.topic) titleLine.createSpan({ text: item.topic, cls: "lt-badge lt-badge-muted" });
      if (item.level) titleLine.createSpan({ text: item.level, cls: "lt-badge" });
      info.createDiv({ text: item.latex, cls: "lt-library-detail" });
      if (item.wolfram || item.matlab) {
        var compLine = info.createDiv({ cls: "lt-library-detail" });
        compLine.style.opacity = "0.75";
        compLine.style.fontSize = "0.82em";
        var compParts = [];
        if (item.wolfram) compParts.push("Wolfram: " + item.wolfram);
        if (item.matlab) compParts.push("MATLAB: " + item.matlab);
        compLine.setText(compParts.join("  |  "));
      }

      var trigText = (item.aliases && item.aliases.length)
        ? item.trigger + " (+" + item.aliases.join(", ") + ")"
        : item.trigger;
      row.createEl("code", { text: trigText });

      var editBtn = row.createEl("button", { text: "Edit" });
      editBtn.type = "button";
      self.comp.registerDomEvent(editBtn, "click", function() { self.editItem(item, false); });

      var delBtn = row.createEl("button", { text: "Delete" });
      delBtn.type = "button";
      self.comp.registerDomEvent(delBtn, "click", function() {
        if (self.activeTab === "snippets") self.plugin.settings.customSnippets = self.plugin.settings.customSnippets.filter(function(x) { return x.id !== item.id; });
        else if (self.activeTab === "shortcuts") self.plugin.settings.customShortcuts = self.plugin.settings.customShortcuts.filter(function(x) { return x.id !== item.id; });
        else self.plugin.settings.customTemplates = self.plugin.settings.customTemplates.filter(function(x) { return x.id !== item.id; });
        self.plugin.saveSettings().then(function() { renderFilteredRows(); });
      });
    };

    var renderNextBatch = function() {
      if (renderedCount >= currentFiltered.length) return;
      var nextItems = currentFiltered.slice(renderedCount, renderedCount + pageSize);
      nextItems.forEach(appendRow);
      renderedCount += nextItems.length;
      countLabel.setText("Showing " + renderedCount + " of " + currentFiltered.length + " matching items");
    };

    var renderFilteredRows = function() {
      listEl.empty();
      renderedCount = 0;
      var rawCollection =
        self.activeTab === "snippets"
          ? self.plugin.settings.customSnippets
          : self.activeTab === "shortcuts"
          ? self.plugin.settings.customShortcuts
          : self.plugin.settings.customTemplates;

      var q = self.searchQuery.toLowerCase().trim();
      currentFiltered = (rawCollection || []).filter(function(item) {
        if (self.selectedDomains.length > 0 && item.domain !== "all" && self.selectedDomains.indexOf(item.domain) === -1) return false;
        if (self.selectedTopic !== "all" && item.topic && item.topic !== self.selectedTopic) return false;
        return itemMatchesQuery(item, q);
      });

      if (currentFiltered.length === 0) {
        countLabel.setText("Showing 0 of 0 matching items");
        listEl.createDiv({ text: "No matching formulas found.", cls: "lt-empty" });
        return;
      }

      renderNextBatch();
    };

    if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = null;
    this.comp.registerDomEvent(searchInput, "input", function() {
      self.searchQuery = searchInput.value;
      if (self.searchDebounceTimer) clearTimeout(self.searchDebounceTimer);
      self.searchDebounceTimer = setTimeout(function() {
        renderFilteredRows();
      }, 120);
    });

    this.comp.registerDomEvent(listEl, "scroll", function() {
      if (listEl.scrollTop + listEl.clientHeight >= listEl.scrollHeight - 60) {
        renderNextBatch();
      }
    });

    renderFilteredRows();
  }

  addItem() {
    var newItem = {
      id: "stem-" + Date.now(),
      name: this.activeTab !== "shortcuts" ? "Custom Formula" : undefined,
      trigger: "",
      aliases: [],
      latex: "",
      domain: this.selectedDomains[0] || "math",
      topic: this.selectedTopic !== "all" ? this.selectedTopic : "",
      subtopic: "",
      enabled: true
    };
    this.editItem(newItem, true);
  }

  editItem(item, isNew) {
    var modal = new obsidian.Modal(this.app);
    var self = this;
    var previewComp = new obsidian.Component();

    modal.onOpen = function() {
      previewComp.load();
      modal.modalEl.addClass("latex-toolbox-edit-modal");
      modal.titleEl.setText(isNew ? "Create New STEM Item" : "Edit STEM Item");
      var contentEl = modal.contentEl;
      contentEl.empty();

      var nameVal = item.name || "";
      var trigVal = item.trigger || "";
      var aliasVal = Array.isArray(item.aliases) ? item.aliases.join(", ") : "";
      var latexVal = item.latex || "";
      var domVal = item.domain || "math";
      var topicVal = item.topic || "";

      if (self.activeTab !== "shortcuts") {
        new obsidian.Setting(contentEl).setName("Formula Name").addText(function(t) {
          t.setValue(nameVal).onChange(function(v) { nameVal = v; });
        });
      }

      new obsidian.Setting(contentEl)
        .setName("Primary Trigger & Aliases")
        .setDesc("Comma-separated (e.g. ddx, d/dx, deriv)")
        .addText(function(t) {
          var combined = [trigVal].concat(aliasVal ? aliasVal.split(",").map(function(s) { return s.trim(); }) : []).filter(Boolean).join(", ");
          t.setValue(combined).onChange(function(v) {
            var parts = v.split(",").map(function(s) { return s.trim(); }).filter(Boolean);
            trigVal = parts[0] || "";
            aliasVal = parts.slice(1).join(", ");
          });
        });

      new obsidian.Setting(contentEl)
        .setName("Subject & Topic Branch")
        .addDropdown(function(d) {
          d.addOption("all", "All Subjects");
          Object.keys(TAXONOMY).forEach(function(k) { d.addOption(k, TAXONOMY[k].label); });
          d.setValue(domVal).onChange(function(v) { domVal = v; });
        })
        .addText(function(t) {
          t.setPlaceholder("Branch (e.g. calculus)").setValue(topicVal).onChange(function(v) { topicVal = v; });
        });

      var wolframVal = item.wolfram || "";
      var matlabVal = item.matlab || "";

      new obsidian.Setting(contentEl)
        .setName("Wolfram Alpha / Notebook Command")
        .setDesc("Natural language or Mathematica workbook query")
        .addText(function(t) {
          t.setPlaceholder("e.g. solve a*x^2 + b*x + c = 0").setValue(wolframVal).onChange(function(v) { wolframVal = v; });
        });

      new obsidian.Setting(contentEl)
        .setName("MATLAB Natural Command")
        .setDesc("Executable MATLAB function or command syntax")
        .addText(function(t) {
          t.setPlaceholder("e.g. roots([a b c])").setValue(matlabVal).onChange(function(v) { matlabVal = v; });
        });

      var slotHelperBar = contentEl.createDiv("lt-edit-slot-bar");
      slotHelperBar.createSpan({ text: "Helpers:", cls: "lt-subtitle" });
      var latexAreaEl;
      var slotCounter = 1;

      var insertSlotBtn = slotHelperBar.createEl("button", { text: "+ Insert ${n:var} Slot", cls: "lt-topic-chip" });
      insertSlotBtn.type = "button";
      insertSlotBtn.onclick = function() {
        if (!latexAreaEl) return;
        var token = "${" + slotCounter + ":x_" + slotCounter + "}";
        slotCounter++;
        var start = latexAreaEl.selectionStart;
        var end = latexAreaEl.selectionEnd;
        latexVal = latexVal.slice(0, start) + token + latexVal.slice(end);
        latexAreaEl.value = latexVal;
        renderEditPreview();
      };

      var natConvertEditBtn = slotHelperBar.createEl("button", { text: "⚡ Convert Natural Math -> LaTeX", cls: "lt-topic-chip" });
      natConvertEditBtn.type = "button";
      natConvertEditBtn.onclick = function() {
        if (!latexAreaEl) return;
        latexVal = wolframNaturalToLatex(latexAreaEl.value);
        latexAreaEl.value = latexVal;
        renderEditPreview();
      };

      var previewBox = contentEl.createDiv("lt-preview lt-edit-preview");
      var renderEditPreview = function() {
        previewComp.unload();
        previewComp = new obsidian.Component();
        previewComp.load();
        previewBox.empty();
        var extracted = extractTemplateSlots(latexVal, false);
        var compiled = compileTemplateWithSlots(extracted.template, extracted.slots, null);
        if (!compiled.trim()) {
          previewBox.createDiv({ text: "Live preview will render here...", cls: "lt-preview-empty" });
          return;
        }
        obsidian.MarkdownRenderer.render(self.app, wrapMath(compiled, "block"), previewBox, "", previewComp);
      };

      new obsidian.Setting(contentEl)
        .setName("LaTeX Template")
        .addTextArea(function(t) {
          latexAreaEl = t.inputEl;
          t.inputEl.rows = 4;
          t.setValue(latexVal).onChange(function(v) {
            latexVal = v;
            renderEditPreview();
          });
        });

      attachSmartMathInputBehaviors(previewComp, latexAreaEl, self.plugin, function(v) {
        latexVal = v;
        renderEditPreview();
      });

      renderEditPreview();

      new obsidian.Setting(contentEl).addButton(function(b) {
        b.setButtonText("Save Item").setCta().onClick(function() {
          if (!trigVal || !latexVal.trim()) {
            new obsidian.Notice("Trigger and LaTeX are required.");
            return;
          }
          item.trigger = trigVal;
          item.aliases = aliasVal ? aliasVal.split(",").map(function(s) { return s.trim(); }).filter(Boolean) : [];
          item.latex = latexVal.trim();
          item.domain = domVal;
          item.topic = topicVal.trim();
          item.wolfram = wolframVal.trim();
          item.matlab = matlabVal.trim();
          if (self.activeTab !== "shortcuts") item.name = nameVal.trim() || trigVal;

          if (isNew) {
            if (self.activeTab === "snippets") self.plugin.settings.customSnippets.push(item);
            else if (self.activeTab === "shortcuts") self.plugin.settings.customShortcuts.push(item);
            else self.plugin.settings.customTemplates.push(item);
          }
          self.plugin.saveSettings().then(function() {
            modal.close();
            self.render();
          });
        });
      });
    };

    modal.onClose = function() { previewComp.unload(); };
    modal.open();
  }

  importMultipleLibraries() {
    var input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.multiple = true;
    var self = this;

    input.onchange = async function(e) {
      var files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      var mergeArray = function(existing, incoming) {
        var map = new Map();
        (existing || []).forEach(function(item) { map.set(item.id || item.trigger, item); });
        (incoming || []).forEach(function(item) {
          var key = item.id || item.trigger;
          if (key) map.set(key, Object.assign({}, map.get(key) || {}, item));
        });
        return Array.from(map.values());
      };

      var count = 0;
      for (var i = 0; i < files.length; i++) {
        try {
          var data = JSON.parse(await files[i].text());
          if (Array.isArray(data.customShortcuts)) self.plugin.settings.customShortcuts = mergeArray(self.plugin.settings.customShortcuts, data.customShortcuts);
          if (Array.isArray(data.customSnippets)) self.plugin.settings.customSnippets = mergeArray(self.plugin.settings.customSnippets, data.customSnippets);
          if (Array.isArray(data.customTemplates)) self.plugin.settings.customTemplates = mergeArray(self.plugin.settings.customTemplates, data.customTemplates);
          count++;
        } catch (err) {
          new obsidian.Notice("Skipped invalid JSON: " + files[i].name);
        }
      }
      await self.plugin.saveSettings();
      new obsidian.Notice("Merged " + count + " JSON pack(s) into database!");
      self.render();
    };
    input.click();
  }

  exportLibrary() {
    var payload = JSON.stringify(
      {
        customShortcuts: this.plugin.settings.customShortcuts,
        customSnippets: this.plugin.settings.customSnippets,
        customTemplates: this.plugin.settings.customTemplates
      },
      null,
      2
    );
    var blob = new Blob([payload], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "latex-toolbox-unified-database.json";
    a.click();
    URL.revokeObjectURL(url);
    new obsidian.Notice("Unified STEM database exported.");
  }

  onClose() {
    if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
    this.comp.unload();
    this.contentEl.empty();
  }
}

// ============================================================================
// 11. EDITOR AUTOCOMPLETE, SETTINGS TAB & MAIN PLUGIN WITH PUBLIC API
// ============================================================================
class STEMEditorSuggest extends obsidian.EditorSuggest {
  constructor(plugin) {
    super(plugin.app);
    this.plugin = plugin;
  }

  onTrigger(cursor, editor) {
    if (!this.plugin.settings.autocompleteEnabled) return null;
    var line = editor.getLine(cursor.line).slice(0, cursor.ch);
    var match = line.match(/(?:^|\s|\$|\()([a-zA-Z0-9/_+\-=]{2,24})$/) || line.match(/\\([a-zA-Z0-9/_+\-=]{2,24})$/);
    if (!match) return null;
    var query = match[1] || "";
    var hasSlash = line.charAt(cursor.ch - query.length - 1) === "\\";
    return {
      editor: editor,
      query: query,
      start: { line: cursor.line, ch: cursor.ch - query.length - (hasSlash ? 1 : 0) },
      end: cursor
    };
  }

  getSuggestions(context) {
    var q = context.query.toLowerCase().trim();
    if (!q) return [];
    var max = this.plugin.settings.autocompleteMaxResults || 14;
    if (this.plugin.fastSearchFormulas) {
      return this.plugin.fastSearchFormulas(q, max);
    }
    var all = [].concat(
      (this.plugin.settings.customShortcuts || []).map(function(x) { return Object.assign({}, x, { kind: "symbol" }); }),
      (this.plugin.settings.customSnippets || []).map(function(x) { return Object.assign({}, x, { kind: "formula" }); }),
      (this.plugin.settings.customTemplates || []).map(function(x) { return Object.assign({}, x, { kind: "template" }); })
    ).filter(function(x) { return x.enabled !== false; });

    return all.filter(function(x) { return itemMatchesQuery(x, q); }).slice(0, max);
  }

  renderSuggestion(item, el) {
    el.addClass("lt-editor-suggestion");
    var top = el.createDiv("lt-library-name-row");
    top.createSpan({ text: item.name || item.trigger, cls: "lt-editor-suggestion-title" });
    if (item.domain) top.createSpan({ text: item.domain, cls: "lt-badge" });
    var aliases = (item.aliases && item.aliases.length) ? " [" + [item.trigger].concat(item.aliases).join(", ") + "]" : " [" + item.trigger + "]";
    el.createDiv({ text: item.kind + aliases + " · " + (item.latex || item.replacement || ""), cls: "lt-editor-suggestion-detail" });
  }

  selectSuggestion(item) {
    var context = this.context;
    if (!context) return;
    var content = item.latex || item.replacement || "";
    var extracted = extractTemplateSlots(content, false);
    if (extracted.slots.length > 0) {
      new InNoteSlotPopupModal(this.plugin.app, this.plugin, context.editor, item, {
        start: context.start,
        end: context.end
      }).open();
      return;
    }
    var parsed = parseSnippetTabstops(content);
    context.editor.replaceRange(parsed.text, context.start, context.end);
  }
}

class LatexToolboxSettingTab extends obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    var containerEl = this.containerEl;
    containerEl.empty();
    var self = this;

    containerEl.createEl("h2", { text: "LaTeX Toolbox v4.6 Settings" });

    new obsidian.Setting(containerEl)
      .setName("Frosted Glassmorphism & Material 3")
      .setDesc("Enable frosted glass panels, luminous accent borders, and Material 3 elevation.")
      .addToggle(function(t) {
        t.setValue(self.plugin.settings.glassmorphism !== false);
        t.onChange(async function(val) {
          self.plugin.settings.glassmorphism = val;
          await self.plugin.saveSettings();
          self.plugin.applyThemePreferences();
        });
      });

    new obsidian.Setting(containerEl)
      .setName("Default Subject Filter Layout")
      .addDropdown(function(d) {
        d.addOption("bar", "Single Compact Horizontal Bar");
        d.addOption("pills", "Compact Collapsible Pill Rows");
        d.setValue(self.plugin.settings.filterLayout || "bar");
        d.onChange(function(val) {
          self.plugin.settings.filterLayout = val;
          self.plugin.saveSettings();
        });
      });

    new obsidian.Setting(containerEl)
      .setName("Default UI Scale")
      .addDropdown(function(d) {
        d.addOption("100", "100% (Compact)");
        d.addOption("115", "115% (Optimal Comfort)");
        d.addOption("130", "130% (Large)");
        d.setValue(self.plugin.settings.uiScale || "115");
        d.onChange(function(val) {
          self.plugin.settings.uiScale = val;
          self.plugin.saveSettings();
        });
      });

    new obsidian.Setting(containerEl)
      .setName("Manage STEM Curriculum Library")
      .addButton(function(b) {
        b.setButtonText("Open STEM Library Manager").setCta().onClick(function() {
          new LibraryManagerModal(self.app, self.plugin).open();
        });
      });
  }
}

class LatexToolboxPlugin extends obsidian.Plugin {
  async onload() {
    await this.loadSettings();
    this.applyThemePreferences();
    this.floatingSolver = null;
    this.activeBuilderModal = null;
    this.casProviders = new Map();
    this.activeCASProviderId = null;

    this.api = this.createPublicAPI();
    window.LatexToolboxAPI = this.api;

    this.addSettingTab(new LatexToolboxSettingTab(this.app, this));
    this.registerEditorSuggest(new STEMEditorSuggest(this));

    var self = this;
    this.registerEvent(
      this.app.workspace.on("editor-paste", function(evt, editor) {
        if (!self.settings.autoFixOnPaste) return;
        var text = evt.clipboardData ? evt.clipboardData.getData("text/plain") : "";
        if (text && (text.indexOf("\\(") !== -1 || text.indexOf("\\[") !== -1)) {
          evt.preventDefault();
          var normalized = normalizeDelimiters(text, self.settings.wrapStyle);
          editor.replaceSelection(normalized);
          new obsidian.Notice("Normalized LaTeX delimiters from clipboard.");
        }
      })
    );

    this.addCommand({
      id: "open-stem-builder",
      name: "Open interactive STEM builder",
      callback: function() { self.api.openBuilder(); }
    });

    this.addCommand({
      id: "open-floating-step-solver",
      name: "Open floating Step-by-Step STEM Solver window",
      callback: function() { self.openFloatingSolver(null); }
    });

    this.addCommand({
      id: "manage-stem-library",
      name: "Manage STEM library (Multi-Subject Tree / Import / Export)",
      callback: function() { self.api.openLibraryManager(); }
    });

    this.addRibbonIcon("calculator", "STEM LaTeX Builder", function() {
      self.api.openBuilder();
    });
  }

  openFloatingSolver(builderRef, presetId) {
    if (this.floatingSolver) {
      this.floatingSolver.close();
    }
    this.floatingSolver = new FloatingSolverWindow(this.app, this, builderRef || this.activeBuilderModal);
    this.floatingSolver.open(presetId);
    return this.floatingSolver;
  }

  createPublicAPI() {
    var self = this;
    return {
      version: "4.5.0",
      openBuilder: function(initialText, initialItem) {
        var view = self.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
        var editor = view ? view.editor : null;
        var text = initialText !== undefined ? initialText : (editor ? editor.getSelection() : "");
        var modal = new EquationWorkspaceModal(self.app, self, editor, text, initialItem);
        modal.open();
        return modal;
      },
      openFloatingSolver: function(presetId) {
        return self.openFloatingSolver(self.activeBuilderModal, presetId);
      },
      openInNoteSlotPopup: function(itemOrLatex, customEditor, replaceRange) {
        var view = self.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
        var editor = customEditor || (view ? view.editor : null);
        var item = typeof itemOrLatex === "string"
          ? { name: "Custom Formula", trigger: "custom", latex: itemOrLatex }
          : itemOrLatex;
        var modal = new InNoteSlotPopupModal(self.app, self, editor, item, replaceRange || null);
        modal.open();
        return modal;
      },
      openLibraryManager: function(initialTab, selectedDomains) {
        var modal = new LibraryManagerModal(self.app, self);
        if (initialTab) modal.activeTab = initialTab;
        if (Array.isArray(selectedDomains)) modal.selectedDomains = selectedDomains;
        modal.open();
        return modal;
      },
      wolframToLatex: function(naturalMathString) {
        return wolframNaturalToLatex(naturalMathString);
      },
      parseMatlabMatrix: function(matlabString, bracketType) {
        return parseMatlabMatrixInput(matlabString, bracketType || "bmatrix");
      },
      balanceChemicalEquation: function(reactants, products, autoBalance) {
        return validateAndBalanceChemEquation(reactants, products, autoBalance !== false);
      },
      getEEFormalizations: function() {
        return JSON.parse(JSON.stringify(EE_FORMALIZATIONS));
      },
      getTaxonomy: function() { return JSON.parse(JSON.stringify(TAXONOMY)); },
      getAllItems: function() {
        return [].concat(
          (self.settings.customShortcuts || []).map(function(x) { return Object.assign({}, x, { kind: "shortcut" }); }),
          (self.settings.customSnippets || []).map(function(x) { return Object.assign({}, x, { kind: "snippet" }); }),
          (self.settings.customTemplates || []).map(function(x) { return Object.assign({}, x, { kind: "template" }); })
        );
      },
      searchFormulas: function(query, options) {
        var opts = options || {};
        var q = (query || "").toLowerCase().trim();
        return this.getAllItems().filter(function(item) {
          if (opts.enabledOnly !== false && item.enabled === false) return false;
          if (opts.domain && item.domain !== "all" && item.domain !== opts.domain) return false;
          if (opts.topic && item.topic !== opts.topic) return false;
          if (opts.subtopic && item.subtopic !== opts.subtopic) return false;
          return itemMatchesQuery(item, q);
        });
      },
      getByTrigger: function(triggerOrAlias) {
        var t = (triggerOrAlias || "").toLowerCase().trim();
        return this.getAllItems().find(function(item) {
          if (item.trigger && item.trigger.toLowerCase() === t) return true;
          if (Array.isArray(item.aliases)) return item.aliases.some(function(a) { return a.toLowerCase() === t; });
          return false;
        }) || null;
      },
      extractSlots: function(template, autoDetectBraces) { return extractTemplateSlots(template, autoDetectBraces !== false); },
      compileSlots: function(template, slots, highlightSlotId) { return compileTemplateWithSlots(template, slots, highlightSlotId || null); },
      validateLatex: function(latexString) { return validateSlotValue(latexString); },
      normalizeDelimiters: function(text, wrapStyle) { return normalizeDelimiters(text, wrapStyle || self.settings.wrapStyle); },
      wrapMath: function(latex, wrapStyle) { return wrapMath(latex, wrapStyle || self.settings.wrapStyle); },
      registerFormula: async function(item, category) {
        var cat = category || "snippets";
        var target = cat === "shortcuts" ? self.settings.customShortcuts : cat === "templates" ? self.settings.customTemplates : self.settings.customSnippets;
        var id = item.id || ("ext-" + Date.now());
        var existingIdx = target.findIndex(function(x) { return x.id === id || x.trigger === item.trigger; });
        var record = Object.assign({ id: id, enabled: true, domain: "all" }, item);
        if (existingIdx >= 0) target[existingIdx] = Object.assign({}, target[existingIdx], record);
        else target.push(record);
        await self.saveSettings();
        return record;
      },
      registerCASProvider: function(provider) {
        if (!provider || !provider.id || typeof provider.solve !== "function") {
          throw new Error("Invalid CAS Provider definition. Must provide 'id' and 'solve(expr, options)' function.");
        }
        self.casProviders.set(provider.id, provider);
        if (!self.activeCASProviderId) {
          self.activeCASProviderId = provider.id;
        }
        new obsidian.Notice("LaTeX Toolbox: Connected CAS Provider '" + (provider.name || provider.id) + "'");
        return true;
      },
      unregisterCASProvider: function(id) {
        var deleted = self.casProviders.delete(id);
        if (self.activeCASProviderId === id) {
          var next = self.casProviders.keys().next();
          self.activeCASProviderId = next.done ? null : next.value;
        }
        return deleted;
      },
      getCASProviders: function() {
        return Array.from(self.casProviders.values()).map(function(p) {
          return { id: p.id, name: p.name || p.id, isAvailable: typeof p.isAvailable === "function" ? p.isAvailable() : true };
        });
      },
      getActiveCASProvider: function() {
        return self.activeCASProviderId ? self.casProviders.get(self.activeCASProviderId) : null;
      },
      setActiveCASProvider: function(id) {
        if (self.casProviders.has(id)) {
          self.activeCASProviderId = id;
          return true;
        }
        return false;
      },
      solveWithCAS: async function(expression, options) {
        var provider = this.getActiveCASProvider();
        if (!provider) {
          return {
            success: false,
            error: "No local CAS provider currently connected.",
            fallbackPrompt: "Please provide a rigorous, clear step-by-step mathematical derivation for:\n\n" + expression,
            wolframUrl: "https://www.wolframalpha.com/input?i=" + encodeURIComponent(expression)
          };
        }
        try {
          var res = await provider.solve(expression, options || {});
          return {
            success: true,
            providerId: provider.id,
            resultLatex: res.resultLatex || res.latex || "",
            steps: Array.isArray(res.steps) ? res.steps : []
          };
        } catch (err) {
          return { success: false, error: err.message || String(err) };
        }
      }
    };
  }

  async recordHistory(latex, domain) {
    if (!this.settings.enableHistory) return;
    var item = { id: "eq-" + Date.now(), latex: latex, domain: domain, createdAt: Date.now() };
    var current = this.settings.recentEquations || [];
    this.settings.recentEquations = [item].concat(current.filter(function(x) { return x.latex !== latex; })).slice(0, 30);
    await this.saveSettings();
  }

  rebuildIndex() {
    this.domainIndex = {};
    this.topicIndex = {};
    this.triggerPrefixIndex = {};
    this.allIndexedItems = [];

    var self = this;
    var addItems = function(arr, kind) {
      (arr || []).forEach(function(item) {
        if (item.enabled === false) return;
        var copy = Object.assign({}, item, { kind: kind });

        // Precompute lowercased strings and unified search token string
        var trigLower = (copy.trigger || "").toLowerCase();
        var nameLower = (copy.name || copy.label || "").toLowerCase();
        var aliasesLower = Array.isArray(copy.aliases)
          ? copy.aliases.map(function(a) { return String(a).toLowerCase(); })
          : [];
        var topicLower = (copy.topic || "").toLowerCase();
        var subtopicLower = (copy.subtopic || "").toLowerCase();
        var domainLower = (copy.domain || "").toLowerCase();
        var descLower = (copy.description || "").toLowerCase();
        var wolframLower = (copy.wolfram || "").toLowerCase();
        var matlabLower = (copy.matlab || "").toLowerCase();
        var latexLower = (copy.latex || "").toLowerCase();

        copy._trigLower = trigLower;
        copy._aliasesLower = aliasesLower;
        copy._searchTokens = [
          trigLower,
          nameLower,
          aliasesLower.join(" "),
          topicLower,
          subtopicLower,
          domainLower,
          descLower,
          wolframLower,
          matlabLower,
          latexLower
        ].join(" ");

        self.allIndexedItems.push(copy);

        var d = copy.domain || "all";
        if (!self.domainIndex[d]) self.domainIndex[d] = [];
        self.domainIndex[d].push(copy);

        if (copy.topic) {
          var tKey = d + ":" + copy.topic;
          if (!self.topicIndex[tKey]) self.topicIndex[tKey] = [];
          self.topicIndex[tKey].push(copy);
        }

        // Prefix map (1 to 4 chars) for instantaneous trigger indexing
        var indexPrefix = function(str) {
          if (!str) return;
          for (var len = 1; len <= Math.min(4, str.length); len++) {
            var p = str.slice(0, len);
            if (!self.triggerPrefixIndex[p]) self.triggerPrefixIndex[p] = [];
            self.triggerPrefixIndex[p].push(copy);
          }
        };
        indexPrefix(trigLower);
        for (var a = 0; a < aliasesLower.length; a++) {
          indexPrefix(aliasesLower[a]);
        }
      });
    };

    addItems(this.settings.customShortcuts, "symbol");
    addItems(this.settings.customSnippets, "formula");
    addItems(this.settings.customTemplates, "template");
  }

  fastSearchFormulas(query, maxResults, domainScope, topicScope) {
    if (!this.allIndexedItems) this.rebuildIndex();
    var q = (query || "").toLowerCase().trim();
    if (!q) return [];
    var limit = maxResults || 14;

    var candidatePool = this.allIndexedItems;
    if (domainScope && topicScope && topicScope !== "all") {
      candidatePool = (this.topicIndex[domainScope + ":" + topicScope] || []).concat(
        this.topicIndex["all:" + topicScope] || []
      );
    } else if (domainScope && domainScope !== "all") {
      candidatePool = (this.domainIndex[domainScope] || []).concat(
        this.domainIndex["all"] || []
      );
    } else if (q.length <= 4 && this.triggerPrefixIndex[q]) {
      candidatePool = this.triggerPrefixIndex[q];
    }

    var exactMatches = [];
    var prefixMatches = [];
    var aliasMatches = [];
    var otherMatches = [];
    var seenIds = new Set();

    for (var i = 0; i < candidatePool.length; i++) {
      var item = candidatePool[i];
      if (seenIds.has(item.id)) continue;

      var trig = item._trigLower || (item.trigger || "").toLowerCase();
      if (trig === q) {
        exactMatches.push(item);
        seenIds.add(item.id);
      } else if (trig.startsWith(q)) {
        prefixMatches.push(item);
        seenIds.add(item.id);
      } else {
        var isAlias = false;
        var aliases = item._aliasesLower || item.aliases || [];
        for (var a = 0; a < aliases.length; a++) {
          var al = aliases[a];
          if (al === q || al.startsWith(q)) {
            aliasMatches.push(item);
            seenIds.add(item.id);
            isAlias = true;
            break;
          }
        }
        if (!isAlias && itemMatchesQuery(item, q)) {
          otherMatches.push(item);
          seenIds.add(item.id);
        }
      }

      if (exactMatches.length + prefixMatches.length + aliasMatches.length + otherMatches.length >= limit * 2) {
        break;
      }
    }

    if (candidatePool !== this.allIndexedItems && (exactMatches.length + prefixMatches.length + aliasMatches.length + otherMatches.length) < limit && !domainScope) {
      for (var j = 0; j < this.allIndexedItems.length; j++) {
        var extraItem = this.allIndexedItems[j];
        if (seenIds.has(extraItem.id)) continue;
        if (itemMatchesQuery(extraItem, q)) {
          otherMatches.push(extraItem);
          seenIds.add(extraItem.id);
          if (exactMatches.length + prefixMatches.length + aliasMatches.length + otherMatches.length >= limit) {
            break;
          }
        }
      }
    }

    return exactMatches.concat(prefixMatches, aliasMatches, otherMatches).slice(0, limit);
  }

  async loadSettings() {
    var loadedData = (await this.loadData()) || {};
    this.settings = Object.assign(
      {
        wrapStyle: "block",
        convertParens: true,
        autoFixOnPaste: true,
        defaultDomain: "math",
        filterLayout: "bar",
        uiScale: "115",
        enableHistory: true,
        autocompleteEnabled: true,
        autocompleteMaxResults: 12,
        livePreview: true,
        glassmorphism: true,
        recentEquations: [],
        favoriteEquations: [],
        customShortcuts: [],
        customSnippets: [],
        customTemplates: []
      },
      loadedData
    );
    this.rebuildIndex();
  }

  applyThemePreferences() {
    if (this.settings.glassmorphism !== false) {
      document.body.addClass("lt-glassmorphic");
    } else {
      document.body.removeClass("lt-glassmorphic");
    }
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.rebuildIndex();
  }

  onunload() {
    document.body.removeClass("lt-glassmorphic");
    if (this.floatingSolver) this.floatingSolver.close();
    if (window.LatexToolboxAPI === this.api) delete window.LatexToolboxAPI;
  }
}

module.exports = LatexToolboxPlugin;
module.exports.default = LatexToolboxPlugin;