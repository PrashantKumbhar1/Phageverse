export type Pathway = "lytic" | "lysogenic";
export const STAGE_SECONDS = 12;
export const stageIndex = (time: number) =>
  Math.min(6, Math.floor(Math.max(0, time) / STAGE_SECONDS));
export const advance = (time: number, delta: number, speed: number) =>
  Math.min(84, Math.max(0, time + delta * speed));
export const stages = (path: Pathway) => [
  {
    name: "Encounter",
    summary: "A chance meeting in a microscopic world.",
    explorer:
      "A phage drifts toward a bacterium. It can infect only a host with a matching surface receptor.",
    science:
      "Bacteriophage lambda encounters Escherichia coli. Its tail tip recognizes the LamB outer-membrane receptor.",
    vocab: "Host · Receptor",
    why: "Receptor compatibility helps determine which bacteria a phage can infect.",
  },
  {
    name: "Attachment",
    summary: "Recognition becomes a precise connection.",
    explorer: "The phage attaches to a matching receptor on the cell surface.",
    science:
      "Lambda binds to LamB through its tail-tip protein. Lambda has a long, flexible, noncontractile tail; its architecture differs from the familiar T4 phage.",
    vocab: "LamB · Tail tip",
    why: "Stable attachment positions the genome-delivery apparatus at the cell envelope.",
  },
  {
    name: "Genome injection",
    summary: "The genome enters. The capsid stays outside.",
    explorer:
      "The phage sends its DNA into the bacterium. The protein shell stays outside.",
    science:
      "Double-stranded lambda DNA enters the cytoplasm and circularizes through its complementary cos ends. The delivery mechanism is simplified in this visualization.",
    vocab: "Double-stranded DNA · cos ends",
    why: "The viral genome, rather than the entire particle, directs the infection.",
  },
  {
    name: "Two possible futures",
    summary: "One infection. Two possible pathways.",
    explorer:
      "The virus can make new phages or leave its DNA inside the host chromosome.",
    science:
      "A regulatory network involving CI and Cro influences the choice between lytic growth and lysogeny. Host physiology and infection conditions affect this decision.",
    vocab: "CI · Cro · Gene regulation",
    why: "These are alternative outcomes, not an inevitable fixed sequence.",
  },
  path === "lytic"
    ? {
        name: "Genome replication",
        summary: "The cell becomes a site of viral production.",
        explorer:
          "Viral DNA is copied, and the cell makes separate phage parts.",
        science:
          "Lambda DNA replication and viral gene expression supply genomes and structural proteins. Capsids and tails form through distinct assembly pathways.",
        vocab: "Replication · Gene expression",
        why: "New particles require both genetic material and protein structures.",
      }
    : {
        name: "Integration",
        summary: "Viral DNA becomes part of the host chromosome.",
        explorer:
          "The viral DNA joins the bacterium’s DNA. This inserted DNA is called a prophage.",
        science:
          "Integrase-mediated site-specific recombination between attP and attB inserts lambda DNA into the bacterial chromosome, forming a prophage.",
        vocab: "Integrase · Prophage · Recombination",
        why: "Integration allows the viral genome to persist with the host.",
      },
  path === "lytic"
    ? {
        name: "Assembly",
        summary: "Separate components become new phages.",
        explorer:
          "DNA is packed into new heads. Tails join them to complete the phages.",
        science:
          "Viral DNA is packaged into capsids, and independently assembled tails attach to filled heads. Component formation precedes completed virions.",
        vocab: "Packaging · Capsid · Virion",
        why: "Only properly assembled particles can deliver a genome to another host.",
      }
    : {
        name: "Inheritance",
        summary: "The prophage travels with the host genome.",
        explorer:
          "The bacterium copies its DNA and divides. Both daughter cells inherit the prophage.",
        science:
          "The prophage is replicated with the bacterial chromosome and inherited during cell division. CI-mediated repression maintains the lysogenic state.",
        vocab: "Lysogen · Repression · Daughter cells",
        why: "A viral genome can persist across generations without producing new particles.",
      },
  path === "lytic"
    ? {
        name: "Lysis & release",
        summary: "The envelope opens. A new cycle can begin.",
        explorer: "The cell’s boundary breaks down, releasing new phages.",
        science:
          "Lambda holin, endolysin, and spanin functions disrupt the cell envelope, allowing progeny phages to escape. This animation is conceptual and not to scale in time.",
        vocab: "Holin · Endolysin · Lysis",
        why: "Release enables progeny phages to encounter susceptible hosts.",
      }
    : {
        name: "Stable lysogeny",
        summary: "A quiet state, with a conditional exit.",
        explorer:
          "The prophage can stay with the host. Sometimes a stress signal starts the lytic pathway.",
        science:
          "DNA damage can activate the SOS response and promote CI repressor cleavage, allowing prophage induction. Induction is conditional, not inevitable.",
        vocab: "Induction · SOS response",
        why: "A dormant prophage can return to productive infection under suitable conditions.",
      },
];
export const structures = [
  [
    "LamB receptor",
    "An outer-membrane maltoporin recognized by lambda's gpJ tail-tip protein. Receptor binding positions and activates the genome-delivery apparatus; DNA delivery is not depicted as passage through the normal maltose pore.",
  ],
  [
    "Capsid",
    "A protein shell that protects the viral genome. It stays outside during injection.",
  ],
  [
    "Tail",
    "A long, noncontractile tube involved in attachment and genome delivery.",
  ],
  [
    "Tail tip",
    "Recognizes a compatible receptor on the bacterial surface. Lambda is not depicted with T4-style long leg fibers.",
  ],
  [
    "Viral genome",
    "Double-stranded DNA carrying the instructions for infection and new phage production.",
  ],
  [
    "Bacterial chromosome",
    "The host DNA, copied during cell division; it can carry an integrated prophage.",
  ],
  [
    "Cell envelope",
    "The outer membrane, peptidoglycan, and inner membrane surround the E. coli cytoplasm. Layers are simplified here.",
  ],
  [
    "Prophage",
    "Lambda DNA integrated into the bacterial chromosome during lysogeny.",
  ],
];
export const questions = [
  {
    q: "What enters the bacterium during genome injection?",
    a: ["The whole phage", "The viral DNA", "The capsid only"],
    correct: 1,
    why: "The genome enters; the capsid remains outside the cell.",
  },
  {
    q: "What is a prophage?",
    a: ["Integrated viral DNA", "A new bacterial receptor", "An empty capsid"],
    correct: 0,
    why: "A prophage is a phage genome maintained in the host chromosome.",
  },
  {
    q: "What happens before new phages are released?",
    a: [
      "The capsid integrates",
      "All viral DNA integrates first",
      "Genomes and components are assembled",
    ],
    correct: 2,
    why: "Genomes are packaged into capsids and tails attach before release.",
  },
  {
    q: "Must every lysogen eventually undergo induction?",
    a: [
      "Yes, immediately",
      "No, induction is conditional",
      "Yes, at each division",
    ],
    correct: 1,
    why: "Lysogeny can persist. Appropriate signals can induce the lytic pathway.",
  },
];
export const explorerQuestions = [
  {
    ...questions[0],
    q: "Which part of a phage goes into the bacterium?",
    a: ["The entire virus", "Its DNA", "Its outer shell"],
  },
  {
    ...questions[1],
    q: "What is a prophage?",
    a: [
      "Viral DNA joined to the host DNA",
      "A new cell receptor",
      "An empty virus shell",
    ],
  },
  {
    ...questions[2],
    q: "What must happen before new phages leave the cell?",
    a: [
      "Their shells join the host DNA",
      "All their DNA joins the host DNA",
      "Their DNA and parts are assembled",
    ],
  },
  {
    ...questions[3],
    q: "Does a prophage always have to wake up?",
    a: [
      "Yes, right away",
      "No, it depends on the conditions",
      "Yes, whenever the cell divides",
    ],
  },
];
