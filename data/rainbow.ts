import type { Activity } from "./activity";

// Kitchen-safe density lab based on the six-poster "สายรุ้งในขวด"
// (Rainbow in a Jar) illustrations in data/rainbow-imgs/. Five sugar-water
// solutions of increasing sugar concentration are dyed red / yellow / green /
// blue / purple and layered densest-first into a clear jar.

export const rainbow: Activity = {
  id: "act_rainbow_in_a_glass_v1",
  title: "Rainbow in a Jar: Density Layering with Sugar Water",
  subject: "Introductory Chemistry — Density & Solutions",
  gradeBand: "Primary / early middle school",
  learningGoal:
    "Students prepare five sugar-water solutions of increasing sugar concentration (0, 1, 2, 3, 4 spoons), dye each a different colour, and layer them densest-first into one clear jar to build a stable rainbow — then explain the stack in terms of density (mass per unit volume).",
  materials: [
    "1 clear jar (tall — glass or sturdy plastic)",
    "5 small clear cups (for mixing solutions)",
    "White granulated sugar (~10 spoons total)",
    "Warm water",
    "Measuring spoon",
    "5 food-colouring bottles: red, yellow, green, blue, purple",
    "Small spoon for stirring and gentle pouring",
    "Paper towel (for spills)",
    "An adult to help",
  ],
  safety: [
    "Ask an adult to help — especially when using the jar and pouring.",
    "Wipe spills right away — sugar water on the floor is slippery.",
    "Do not drink the coloured solutions. Food colouring stains skin and clothes.",
    "Wash hands after handling food colouring.",
  ],
  steps: [
    {
      id: "r01",
      title: "Prepare your equipment",
      image: "/rainbow-imgs/s1.png",
      concept:
        "**What you need.** One clear jar (this is where the rainbow will live), five small cups (one per colour), warm water, sugar, five colours of food dye — red, yellow, green, blue, purple — and a small spoon. Ask an adult to help.\n\n**Why five cups.** Each cup will end up as one layer of the rainbow. They start with the same amount of water but different amounts of sugar (0, 1, 2, 3, 4 spoons), which is what makes the layers stack.",
      instructions:
        "Gather everything on your tray: a clear jar, five small cups, warm water, sugar, five food-colouring bottles (red, yellow, green, blue, purple), and a spoon. When you're ready, tap the choice below.",
      inputKind: "choice",
      choices: [
        "Everything is ready — let's go!",
        "I'm missing something — I'll gather the rest first.",
      ],
      expected:
        "Either choice is fine — this step is a readiness check, not a graded answer. The point is to make sure the student has all five colours, the jar, and an adult nearby before pouring anything.",
      hintsPolicy:
        "If the student says they're missing food colouring, ask which colours they have and whether they can borrow the rest. If they don't have a clear jar, ask what could work instead (a tall glass, a clear water bottle with the top cut off) — the container needs to be clear so the layers show.",
    },
    {
      id: "r02",
      title: "Make five cups of coloured water",
      image: "/rainbow-imgs/s2.png",
      concept:
        "**Same water, different dye.** Every cup starts with the SAME amount of warm water — about three spoons. Then you drop one colour of dye into each cup: red into the first, yellow into the second, green into the third, blue into the fourth, purple into the fifth.\n\n**Why food colouring doesn't affect the stack.** A single drop of dye is very light — about the same weight either way. So the colour of a cup does NOT change how heavy it is. It just tells you which cup is which. What will make the layers stack is the sugar you add next.",
      instructions:
        "Pour the SAME amount of warm water into each of the five cups (about three spoons per cup). Then add ONE drop of food colouring to each cup — red, yellow, green, blue, purple. Stir gently so the colour spreads. When done, tap the choice below.",
      inputKind: "choice",
      choices: [
        "All five cups are the same amount of water, one drop of colour in each — red, yellow, green, blue, purple.",
        "The cups don't all have the same amount of water yet.",
        "Some cups have more than one drop of colour.",
      ],
      expected:
        "First option. The five cups must have the same volume of water and one drop of dye each — same water amount is what lets you compare 'more sugar' fairly across cups.",
      hintsPolicy:
        "If they picked the second option, ask them to pour a bit from the fullest cup back into a less full one until all five look equal. If they picked the third option, ask what would happen to the colour if they added many drops — would it just be darker, or would it also add tiny extra weight (yes, but very little).",
    },
    {
      id: "r03",
      title: "Add different amounts of sugar",
      image: "/rainbow-imgs/s3.png",
      concept:
        "**This is the important step.** The colour didn't change how heavy each cup is. The SUGAR does. More sugar dissolved in the same water = a heavier (denser) cup.\n\n- Red cup → **0 spoons** of sugar (no sugar; just coloured water)\n- Yellow cup → **1 spoon**\n- Green cup → **2 spoons**\n- Blue cup → **3 spoons**\n- Purple cup → **4 spoons**\n\nStir each cup until the sugar is (mostly) dissolved. Warm water dissolves sugar faster. If a little sugar sits at the bottom of the purple cup, that's OK as long as the liquid above it is clear.",
      instructions:
        "Add sugar to each cup as shown: 0 spoons in RED, 1 in YELLOW, 2 in GREEN, 3 in BLUE, 4 in PURPLE. Stir each cup until the sugar is dissolved. When done, tap the cup that should end up on the BOTTOM of the jar.",
      inputKind: "choice",
      choices: [
        "Red (0 spoons) — no sugar, so nothing is holding it down.",
        "Yellow (1 spoon).",
        "Green (2 spoons).",
        "Purple (4 spoons) — most sugar means heaviest, so it sinks.",
      ],
      expected:
        "Purple. The cup with the MOST sugar dissolved in the same water is the heaviest for its size — the densest — so it settles at the bottom when layered in the jar.",
      hintsPolicy:
        "If they pick red, ask whether adding sugar makes water heavier or lighter for the same amount. If they pick green (2 spoons), gently ask which cup has the MOST sugar of all five. Do not name the answer — nudge them to the extreme.",
    },
    {
      id: "r04",
      title: "Pour the first layer — purple into the jar",
      image: "/rainbow-imgs/s4.png",
      concept:
        "**Densest first.** To build a stable rainbow, pour the HEAVIEST cup first — that's purple (4 spoons). It sits on the bottom because nothing lighter can push it back up.\n\n**Pour slowly.** Bring the cup close to the jar and pour in a thin, gentle stream. Fast pouring makes bubbles and splashing that will mix the layers later.",
      instructions:
        "Pour the whole PURPLE cup into the empty jar. Pour gently and slowly. Ask an adult to help if the jar is tricky to hold. Take a photo of the jar with just the purple layer inside so we can check it looks even.",
      inputKind: "photo",
      expected:
        "A photo of the jar with a purple layer on the bottom, roughly flat surface, no dye splashed up the walls above the surface.",
      hintsPolicy:
        "If the photo shows dye smeared high on the walls, ask about the pouring speed — could it be slower? If they poured a different colour, ask which cup had the most sugar, and remind them the heaviest goes in first.",
    },
    {
      id: "r05",
      title: "Layer the rest — blue, green, yellow, red",
      image: "/rainbow-imgs/s5.png",
      concept:
        "**Order matters.** After purple, the next-heaviest goes on top of it, then the next, and so on:\n\n1. Purple (4 spoons) — already in\n2. Blue (3 spoons)\n3. Green (2 spoons)\n4. Yellow (1 spoon)\n5. Red (0 spoons)\n\n**Use a spoon to break the fall.** Hold a spoon inside the jar with the curved side up, just above the current top layer. Pour the new cup onto the back of the spoon — the liquid slides down the curve and lands gently. Without the spoon the new liquid punches through and mixes everything.",
      instructions:
        "Layer BLUE next, then GREEN, then YELLOW, and finally RED — each one poured over the back of a spoon so it lands gently. When the whole rainbow is stacked, take a photo of the jar against a plain background.",
      inputKind: "photo",
      expected:
        "A photo showing five roughly horizontal bands, from bottom to top: purple, blue, green, yellow, red. Some blur where the layers meet is normal.",
      hintsPolicy:
        "If two colours mixed, ask about whether the spoon was touching the surface (it should be just above, not dunked). If the layers are in the wrong order, ask which cup had more sugar than the one below it — the answer should always be YES going downward.",
    },
    {
      id: "r06",
      title: "Look at your rainbow — and explain why it works",
      image: "/rainbow-imgs/s6.png",
      concept:
        "**Why it stacks.** All five cups are water — they COULD mix. They stack only because (a) the amount of sugar differs, so each layer is a different density; and (b) you poured slowly enough that the liquids didn't have the energy to punch through the layer below.\n\n**What would break it.** Stirring the jar mixes everything into a muddy brown. Pouring the LIGHTEST cup (red) in first and dropping the HEAVIEST (purple) on top would mix everything immediately, because purple would fall straight through.\n\n**One-word answer for a young sibling.** If they ask why it works, the one word is: **density**.",
      instructions:
        "Look at your rainbow. In 2–4 sentences, explain to a younger friend why purple is at the bottom and red is at the top. Use the word 'density' at least once and say what would happen if the pouring order were reversed.",
      inputKind: "text",
      expected:
        "Should say: more sugar dissolved makes a cup heavier / denser; denser layers sink below lighter ones; purple had the most sugar so it went in first and sits at the bottom; if we poured lightest first and dropped purple on top it would fall straight through and mix everything into brown.",
      hintsPolicy:
        "If they don't mention density, ask what one word describes 'how heavy a liquid is for its size'. If they don't cover the reverse-order case, ask what would happen if the very heavy purple were the LAST cup poured onto the top.",
    },
  ],
  commonMisconceptions: [
    {
      id: "r_m_colour_density",
      label: "Colour changes density",
      description:
        "Student says the different colours make the layers stack. In fact one drop of food colouring is negligible mass; the sugar is what changes density.",
    },
    {
      id: "r_m_temperature",
      label: "Temperature is the layering cause",
      description:
        "Student attributes the stack to hot-vs-cold water. All five cups start at the same warm temperature — sugar concentration, not temperature, is what varies.",
    },
    {
      id: "r_m_order_doesnt_matter",
      label: "Pour order doesn't matter",
      description:
        "Student thinks the fluids will 'sort themselves out'. Pouring the lightest first and dropping the heaviest on top mixes everything — the density gradient can't reassemble once disturbed.",
    },
    {
      id: "r_m_immiscible",
      label: "Sugar solutions are immiscible like oil and water",
      description:
        "Student assumes the layers hold because the fluids can't mix. In fact they CAN mix — they're all water. The layers hold only because pouring is gentle enough not to force mixing across the density boundary.",
    },
    {
      id: "r_m_more_water_denser",
      label: "More water = heavier layer",
      description:
        "Student thinks a fuller cup is what makes a layer sink. All five cups use the same amount of water; only the sugar amount changes. What matters is mass per unit volume (density), not total volume.",
    },
  ],
  chunks: [
    {
      id: "rc01",
      text: "Learning goal: prepare five sugar-water solutions of increasing sugar amount (red 0, yellow 1, green 2, blue 3, purple 4 spoons), dye each a different colour, layer them heaviest-first into one clear jar, and explain the stable stack in terms of density (heaviness per unit size).",
    },
    {
      id: "rc02",
      text: "Density in one sentence: more sugar dissolved in the same amount of water makes the water heavier for its size — that is what 'more dense' means. The heavier (denser) liquid settles below the lighter (less dense) liquid, the way a stone sinks in a pond.",
    },
    {
      id: "rc03",
      text: "Cup preparations for this activity: same amount of warm water in each of five cups (about three spoons per cup). Red = 0 spoons sugar, one drop red dye. Yellow = 1 spoon sugar + 1 drop yellow. Green = 2 + 1 drop green. Blue = 3 + 1 drop blue. Purple = 4 + 1 drop purple. Stir until (mostly) dissolved.",
    },
    {
      id: "rc04",
      text: "Correct layering order into the jar: PURPLE first (bottom, heaviest), then BLUE, then GREEN, then YELLOW, then RED (top, lightest). Reversing the order — pouring red first and dropping purple on top — mixes the whole jar because purple falls straight through the lighter layers.",
    },
    {
      id: "rc05",
      text: "Gentle pouring technique that preserves the layers: after purple is in, hold a small spoon inside the jar with the curved side up, just above the previous layer. Pour the new cup onto the back of the spoon so the liquid slides down the curve and lands gently on the surface. Without a spoon the new liquid punches through and mixes.",
    },
    {
      id: "rc06",
      text: "The five sugar-water solutions are MISCIBLE — they all contain water and would mix if stirred. What holds them apart in the jar is that a slow, careful pour does not give the liquids enough energy to overcome the density difference. This is different from oil and water, which are immiscible and would separate even after violent shaking.",
    },
    {
      id: "rc07",
      text: "Food colouring effect on density: negligible. One drop of dye adds a very small mass compared to a few spoons of water and sugar, so colour does not change the layering order. Colour is only there to make the cups (and later the layers) easy to tell apart.",
    },
    {
      id: "rc08",
      text: "Common wrong turn — reversed pour: the student pours red into the jar first, then yellow, green, blue, purple. Purple (heaviest) dropped on top of lighter layers falls straight through and drags the others into a muddy brown mixture. Fix: heaviest (purple) first.",
    },
    {
      id: "rc09",
      text: "Common wrong turn — attributing the stack to colour or temperature. The mass of one drop of dye is tiny, and all five cups start at the same warm temperature. The only thing that meaningfully differs between the cups is how much sugar is dissolved in them.",
    },
    {
      id: "rc10",
      text: "Safety notes: ask an adult to help, especially when using a glass jar. Sugar water on smooth floors is slippery — wipe spills promptly. Food colouring stains skin and cloth. Do not drink the solutions. Wash hands after handling dye.",
    },
    {
      id: "rc11",
      text: "Expected outcome: a jar with five visible horizontal bands — purple at the bottom, then blue, green, yellow, and red at the top. Some blurring at the interfaces is normal after a few minutes as slow diffusion mixes across the boundaries. If layers mixed during pouring, the fix is to slow the pour and use the back of a spoon.",
    },
    {
      id: "rc12",
      text: "One-word answer for a younger sibling asking why it works: density. More sugar → more dense. Denser layers sink below less-dense ones. Slow pouring and the back-of-a-spoon trick keep the layers from mixing during assembly.",
    },
  ],
};
