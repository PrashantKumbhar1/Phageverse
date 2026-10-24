export const labComponents = [
  {
    name: "Whole specimen",
    group: "Overview",
    title: "A cell, opened for discovery.",
    role: "Explore the host and its attached phage. The amber particle is the virus; the teal rod is the bacterium.",
    look: "The two organisms are enlarged at different scales for clarity.",
    behavior:
      "Switch between exterior, transparent, and cutaway views, or select one structure to isolate it.",
    demo: "Specimen overview",
    source: "https://www.nature.com/articles/s41467-024-48686-3",
  },
  {
    name: "Capsid",
    group: "Bacteriophage",
    title: "Protection, built from proteins.",
    role: "The capsid encloses and protects lambda’s double-stranded DNA. Its shell is mainly gpE, stabilized by gpD.",
    look: "An icosahedral shell with repeated surface proteins, rather than a smooth sphere. The decoration shown is schematic.",
    behavior:
      "Separate the surface proteins with Dissect. Animate DNA packaging into the head; the shell stays outside during infection.",
    demo: "Genome packaging",
    source: "https://pmc.ncbi.nlm.nih.gov/articles/PMC2614288/",
  },
  {
    name: "Portal & neck",
    group: "Bacteriophage",
    title: "The gateway beneath the head.",
    role: "The portal is the entry and exit route for DNA. Connector proteins join the head to the independently assembled tail.",
    look: "Stacked protein rings surround a central channel. The portal has twelvefold organization; other neck rings have different symmetries.",
    behavior:
      "Watch DNA thread through the central opening. Ring separation reveals the channel; it does not represent a natural opening motion.",
    demo: "DNA translocation",
    source: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11092355/",
  },
  {
    name: "Tail",
    group: "Bacteriophage",
    title: "Flexible. Hollow. Noncontractile.",
    role: "The long tail connects the head to the host-binding tip and supports genome delivery. Lambda does not use a contracting sheath.",
    look: "Approximately 32 stacked gpV hexameric rings form the narrow flexible tube in the structural reference.",
    behavior:
      "Dissect the ring stack and follow DNA along the hollow core. Flexing is illustrative; the tube is never shown contracting.",
    demo: "Genome delivery",
    source: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10721106/",
  },
  {
    name: "Tail tip",
    group: "Bacteriophage",
    title: "A precise molecular handshake.",
    role: "The gpJ receptor-binding tip recognizes a compatible LamB protein on the bacterial outer membrane.",
    look: "A threefold protein complex and central fiber. Common laboratory lambda lacks the long side fibers present in original isolates.",
    behavior:
      "Play the docking demonstration to see the tip approach LamB and change shape after recognition. This is a conceptual conformational animation.",
    demo: "Receptor docking",
    source: "https://www.nature.com/articles/s41467-024-48686-3",
  },
  {
    name: "Viral genome",
    group: "Bacteriophage",
    title: "The instructions, not the whole virus.",
    role: "Lambda carries double-stranded DNA. After delivery, complementary cos ends allow the genome to circularize.",
    look: "Two strands with paired connections, tightly packed in the capsid and released into the host cytoplasm.",
    behavior:
      "Watch a linear teaching representation close into a circle. Bases, turns, and total length are vastly simplified.",
    demo: "Circularization",
    source: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4424060/",
  },
  {
    name: "LamB receptor",
    group: "Bacterium",
    title: "The host determines the match.",
    role: "LamB is a maltoporin in the outer membrane. A compatible form is recognized by lambda’s tail tip.",
    look: "Three beta-barrel subunits form a trimer. The model suggests barrel strands and extracellular loops without using atomic coordinates.",
    behavior:
      "Watch the amber tail tip bind the teal trimer. DNA delivery is not depicted as passage through LamB’s normal maltose pore.",
    demo: "Host recognition",
    source: "https://www.nature.com/articles/s41467-024-48686-3",
  },
  {
    name: "Cell envelope",
    group: "Bacterium",
    title: "Three layers, different jobs.",
    role: "E. coli has an outer membrane, a thin peptidoglycan layer in the periplasm, and an inner membrane around the cytoplasm.",
    look: "Inspect lipid head groups and tails, a schematic peptidoglycan mesh, and outer-surface LPS chains. Layer thickness and spacing are exaggerated.",
    behavior:
      "Separate the layers. The lysis demonstration opens them in sequence to illustrate envelope disruption; real holin, endolysin, and spanin actions are molecular processes.",
    demo: "Envelope breakdown",
    source: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5668860/",
  },
  {
    name: "Bacterial chromosome",
    group: "Bacterium",
    title: "A genome without a nucleus.",
    role: "The host chromosome occupies the nucleoid. It is copied before daughter cells inherit their genetic information.",
    look: "A condensed, schematic circular double-stranded chromosome; its conformation is not a molecular reconstruction.",
    behavior:
      "Watch a second copy separate from the first. A bacterium has no membrane-bound nucleus surrounding its DNA.",
    demo: "Chromosome copying",
    source: "https://www.ncbi.nlm.nih.gov/books/NBK26865/",
  },
  {
    name: "Prophage",
    group: "Bacterium",
    title: "Viral DNA becomes an inherited passenger.",
    role: "An integrated lambda genome is a prophage. It can be replicated with the host chromosome without making new particles.",
    look: "The violet segment is part of the green host chromosome. A whole capsid never becomes integrated DNA.",
    behavior:
      "Watch the marked segment grow into the chromosome and be copied with it. Integration and inheritance are conceptual, not an atomic recombination movie.",
    demo: "Integration & inheritance",
    source: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11096046/",
  },
  {
    name: "Ribosome",
    group: "Bacterium",
    title: "The host’s protein-building machinery.",
    role: "Bacterial ribosomes translate messenger RNA into proteins. During productive infection, host translation machinery makes viral proteins.",
    look: "A schematic large and small subunit around an mRNA strand, with a growing peptide chain.",
    behavior:
      "Watch mRNA pass between the subunits and a peptide extend. A ribosome produces protein chains, not instant finished phages.",
    demo: "Protein synthesis",
    source: "https://www.ncbi.nlm.nih.gov/books/NBK26829/",
  },
] as const;
export type LabComponent = (typeof labComponents)[number]["name"];
