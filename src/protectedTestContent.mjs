/* src/protectedTestContent.mjs */
const readingLegacyFactory1 = function (H) {
      const { renderHeadingsTask, renderShortAnswerBlock, renderNotesBlock, renderSentenceGapsBlock, renderTFNGBlock, renderMCQBlock, renderEndingsMatchBlock, renderSummarySelectBlock } = H;
      const PART1_PASSAGE_TEXT = `
The Life of Sir Isaac Newton

A. Isaac Newton was born on January 4, 1643, in Lincolnshire, England. The son of a farmer, who died three months before he was born, Newton spent most of his early years with his maternal grandmother after his mother remarried. Following an education interrupted by a failed attempt to turn him into a farmer, he attended the King’s School in Grantham before enrolling at the University of Cambridge’s Trinity College in 1661, where he soon became fascinated by the works of modern philosophers such as René Descartes. When the Great Plague shut Cambridge off from the rest of England in 1665, Newton returned home and began formulating his theories on calculus, light and color, his farm the setting for the supposed falling apple that inspired his work on gravity.

B. Newton returned to Cambridge in 1667. He constructed the first reflecting telescope in 1668, and the following year he received his Master of Arts degree and took over as Cambridge’s Professor of Mathematics. In 1671 he was asked to give a demonstration of his telescope to the Royal Society of London in 1671, the same year he was elected to the prestigious Society. The following year, fascinated with the study of light, he published his notes on optics for his peers. Through his experiments, Newton determined that white light was a composite of all the colors on the spectrum, and he asserted that light was composed of particles instead of waves. His methods were heavily criticized by established Society member Robert Hooke, who was also unwilling to compromise again with Newton’s follow-up paper in 1675. Known for his temperamental defense of his work, Newton engaged in heated correspondence with Hooke before suffering a nervous breakdown and withdrawing from the public eye in 1678. In the following years, he returned to his earlier studies on the forces governing gravity.

C. In 1684, English astronomer Edmund Halley paid a visit to the reclusive Newton. Upon learning that Newton had mathematically worked out the elliptical paths of celestial bodies, such as the movement of the planets around the sun, Halley urged him to organize his notes. The result was the 1687 publication of “Philosophiae Naturalis Principia Mathematica” (Mathematical Principles of Natural Philosophy), which established the three laws of motion and the law of universal gravity. Principia made Newton a star in intellectual circles, eventually earning him widespread acclaim as one of the most important figures in modern science.

D. As a now influential figure, Newton opposed King James II’s attempts to reinstate Catholic teachings at English Universities, and was elected to represent Cambridge in Parliament in 1689. He moved to London permanently after being named warden of the Royal Mint in 1696, earning a promotion to master of the Mint three years later. Determined to prove his position wasn’t merely symbolic, Newton moved the pound sterling from the silver to the gold standard and sought to punish forgers.

E. The death of Hooke in 1703 allowed Newton to take over as president of the Royal Society, and the following year he published his second major work, “Opticks.” Composed largely from his earlier notes on the subject, the book detailed Newton’s experiments with refraction and the color spectrum, and also contained his conclusions on such matters as energy and electricity. In 1705, he was knighted by Queen Anne of England.

F. Around this time, the debate over Newton’s claims to originating the field of calculus, the mathematical study of change, exploded into a nasty dispute. Newton had developed his mathematical concept of ‘fluxions’ (differentials) in the mid-1660s to account for celestial orbits, though there was no public record of his work. In the meantime, German mathematician Gottfried Leibniz formulated his own theories and published them in 1684. As president of the Royal Society, Newton oversaw an investigation that ruled his work to be the founding basis of the field, but the debate continued even after Leibniz’s death in 1716. Researchers later concluded that both men likely arrived at their conclusions independent of one another.

G. Newton was also obsessed with history and religious doctrines, and his writings on those subjects were collected into multiple books that were published after his death. Having never married, Newton spent his later years living with his niece at Cranbury Park, near Winchester, England. He died on March 31, 1727, and was buried in Westminster Abbey. A giant even among the brilliant minds that drove the Scientific Revolution, Newton is remembered as an extraordinary scholar, inventor and writer. His theories about the movement of bodies in the solar system transformed our understanding of the universe and his precise methodology helped to give birth to what is known as the scientific method. Although his theories of space-time and gravity were eventually superseded by those of Einstein his work remains the foundation stone of modern physics was built.
`.trim();

    // =========================
    // PART 1 / 2 / 3 (UNCHANGED)
    // =========================

      const PART1 = {
      id: "part1",
      title: "Part 1",
      renderQuestions: (answers) => {
        const HEADINGS_TASK = {
          title: "Questions 1–6",
          instructions: [
            "The text has seven paragraphs labelled A–G.",
            "Choose the correct headings for paragraphs B–G from the list of headings below.",
            "Write the correct number, i–ix, in the gaps.",
          ],
          listTitle: "List of Headings",
          headings: [
            { value: "i", label: "Continued breakthroughs in research" },
            { value: "ii", label: "Competing claims of originality" },
            { value: "iii", label: "The early years of Sir Isaac Newton" },
            { value: "iv", label: "The legacy of an exceptional mind" },
            { value: "v", label: "Routine life at a 17th century university" },
            { value: "vi", label: "Heated academic disputes" },
            { value: "vii", label: "A new venture" },
            { value: "viii", label: "His crowning achievement" },
            { value: "ix", label: "A controversial theory about planets" },
          ],
          example: { paragraph: "Paragraph A", value: "iii" },
          questions: [
            { q: 1, paragraph: "Paragraph B" },
            { q: 2, paragraph: "Paragraph C" },
            { q: 3, paragraph: "Paragraph D" },
            { q: 4, paragraph: "Paragraph E" },
            { q: 5, paragraph: "Paragraph F" },
            { q: 6, paragraph: "Paragraph G" },
          ],
        };

        const SHORT_Q = {
          title: "Questions 7–8",
          instructions: [
            "Answer the questions below.",
            "Choose NO MORE THAN TWO WORDS from the passage for each answer.",
            "Write your answers in the gaps.",
          ],
          questions: [
            { q: 7, text: "With which scientific organization was Newton associated for much of his career?" },
            { q: 8, text: "With whom did Newton live as he got older?" },
          ],
        };

        const NOTES = {
          title: "Questions 9–13",
          instructions: [
            "Complete the notes below.",
            "Choose ONE WORD from the passage for each answer.",
            "Write your answers in the gaps.",
          ],
          boxTitle: "Sir Isaac Newton’s achievements",
        };

        const wrap = document.createElement("div");
        wrap.appendChild(renderHeadingsTask(HEADINGS_TASK, answers));
        wrap.appendChild(renderShortAnswerBlock(SHORT_Q, answers));
        wrap.appendChild(renderNotesBlock(NOTES, answers));
        return wrap;
      },
    };

      const PART2_PASSAGE_TEXT = `
The Geography of Antarctica

The continent of Antarctica makes up most of the Antarctic region. The Antarctic is a cold, remote area in the Southern Hemisphere encompassed by the Antarctic Convergence, an uneven line of latitude where cold, northward-flowing Antarctic waters meet the warmer waters of the world’s oceans. The whole Antarctic region covers approximately 20 percent of the Southern Hemisphere. Antarctica is the fifth-largest continent in terms of total area, larger than both Oceania and Europe. It is unique in that it does not have a native population. There are no countries in Antarctica, although seven nations claim different parts of it: New Zealand, Australia, France, Norway, the United Kingdom, Chile, and Argentina.

The Antarctic Ice Sheet dominates the region. It is the single piece of ice on Earth covering the greatest area. This ice sheet even extends beyond the continent when snow and ice are at their most extreme. The ice surface dramatically expands from about 3 million square kilometers (1.2 million square miles) at the end of summer to about 19 million square kilometers (7.3 million square miles) by winter. Ice sheet growth mainly occurs at the coastal ice shelves, primarily the Ross Ice Shelf and the Ronne Ice Shelf. Ice shelves are floating sheets of ice that are connected to the continent. Glacial ice moves from the continent’s interior to these lower-elevation ice shelves at rates of 10 to 1,000 meters (33-32,808 feet) per year.

Antarctica has numerous mountain summits, including the Transantarctic Mountains, which divide the continent into eastern and western regions. A few of these summits reach altitudes of more than 4,500 meters (14,764 feet). The elevation of the Antarctic Ice Sheet itself is about 2,000 meters (6,562 feet) and reaches 4,000 meters (13,123 feet) above sealevel near the center of the continent.

Without any ice, the continent would emerge as two distinct areas: a giant peninsula and archipelago of mountainous islands, known as Lesser Antarctica, and a single large landmass about the size of Australia, known as Greater Antarctica. These regions have different geologies; Greater Antarctica, or East Antarctica, is composed of older, igneous rocks whereas Lesser Antarctica, or West Antarctica, is made up of younger, volcanic rock. Lesser Antarctica, in fact, is part of the “Ring of Fire,” a tectonically active area around the Pacific Ocean. Tectonic activity is the interaction of plates on Earth’s crust, often resulting in earthquakes and volcanoes. Mount Erebus, located on Antarctica’s Ross Island, is the southernmost active volcano on Earth.

Antarctica has an extremely cold, dry climate. Winter temperatures along Antarctica’s coast generally range from -10° Celsius to -30° Celsius (14° Fahrenheit to -22° Fahrenheit). During the summer, coastal areas hover around 0°C (32°F) but can reach temperatures as high as 9°C (48°F). In the mountainous, interior regions, temperatures are much colder, dropping below -60°C (-76°F) in winter and -20°C (-4°F) in summer. In 1983, Russia’s Vostok Research Station measured the coldest temperature ever recorded on Earth: -89.2°C (-128.6°F). An even lower temperature was measured using satellite data taken in 2010: -93.2°C (-135.8°F)

Precipitation in the Antarctic is hard to measure. It always falls as snow. Antarctica’s interior is believed to receive only 50 to 100 millimeters (2-4 inches) of water (in the form of snow) every year. The Antarctic desert is one of the driest deserts in the world. The oceans surrounding Antarctica provide an important physical component of the Antarctic region. The waters surrounding Antarctica are relatively deep, reaching 4,000 to 5,000 meters (13,123 to 16,404 feet) in depth.

The Antarctic region has an important role in global climate processes. It is an integral part of the Earth’s heat balance. This balance, also called the energy balance, is the relationship between the amount of solar heat absorbed by Earth’s atmosphere and the amount deflected back into space. Antarctica has a larger role than most continents in maintaining Earth’s heat balance and ice is more reflective than land or water surfaces. As a result, the massive Antarctic Ice Sheet reflects a large amount of solar radiation away from Earth’s surface. As global ice cover (ice sheets and glaciers) decreases, the reflectivity of Earth’s surface also diminishes. This allows more incoming solar radiation to be absorbed by the Earth’s surface, causing an unequal heat balance linked to global warming, the current period of climate change.

Interestingly, NASA scientists have found that climate change has caused more ice to form in some parts of Antarctica. They say this is happening because of new climate patterns caused by this change, which in turn create a strong wind pattern called the ‘polar vortex.’ These kinds of polar winds lower temperatures in the Antarctic and have been building in strength in recent decades—as much as 15 percent since 1980. This effect is not seen throughout the Antarctic, however, and some parts are experiencing ice melt
`;

      const PART2 = {
      id: "part2",
      title: "Part 2",
      renderQuestions: (answers) => {
        const wrap = document.createElement("div");

        wrap.appendChild(
          renderSentenceGapsBlock(
            {
              title: "Questions 14–17",
              instructions: [
                "Answer the questions below.",
                "Choose NO MORE THAN TWO WORDS from the passage for each answer.",
                "Write your answers in the gaps.",
              ],
              items: [
                { q: 14, text: "Antarctica’s location far from other continents means that it is very", tail: "." },
                { q: 15, text: "Antarctica is alone among the continents in having no", tail: "." },
                { q: 16, text: "The Antarctic ice sheet holds the record as the largest", tail: " ice sheet on Earth." },
                { q: 17, leadingBlank: true, text2: "are blocks of ice connected to the Antarctic ice sheet." },
              ],
            },
            answers
          )
        );

        wrap.appendChild(
          renderTFNGBlock(
            {
              title: "Questions 18–21",
              instructions: [
                "Do the following statements agree with the information in the passage?",
                "Choose TRUE / FALSE / NOT GIVEN.",
                "Write your answers in the gaps.",
              ],
              items: [
                { q: 18, text: "Some of Antarctica’s mountains are popular with climbers." },
                { q: 19, text: "The temperature in Antarctica never rises above 0°C." },
                { q: 20, text: "Antarctica constitutes around one-fifth of the southern half of the world." },
                { q: 21, text: "Rain in Antarctica is rare but falls occasionally." },
              ],
            },
            answers
          )
        );

        wrap.appendChild(
          renderSummarySelectBlock(
            {
              title: "Questions 22–26",
              instructions: [
                "Complete the summary using the list of words, A–G, below.",
                "Choose the correct letter for each answer.",
                "Write your answers in the gaps.",
              ],
              summaryTitle: "Antarctica and the Changing Climate",
              summaryLines: [
                { text: "Antarctica plays an important role in regulating the Earth’s climate through the process of", blankQ: 22, tail: "." },
                { text: "", blankQ: 23, before: "", after: " is diverted away from the Earth by the huge Antarctic ice sheet." },
                { text: "As the size and", blankQ: 24, tail: " of the ice sheet have decreased," },
                { text: "", blankQ: 25, before: "", after: " has caused melting in some parts of the continent." },
                { text: "However, other areas of Antarctica have experienced falling temperatures in recent years, due to", blankQ: 26, tail: ", climate patterns leading to reduced temperatures." },
              ],
              optionsTitle: "List of Words",
              options: [
                { letter: "A", word: "reflectivity" },
                { letter: "B", word: "ice melt" },
                { letter: "C", word: "solar radiation" },
                { letter: "D", word: "polar vortex winds" },
                { letter: "E", word: "heat balance" },
                { letter: "F", word: "water surfaces" },
                { letter: "G", word: "global warming" },
              ],
            },
            answers
          )
        );

        return wrap;
      },
    };

      const PART3_PASSAGE_TEXT = `
Thinking, Fast and Slow

The idea that we are ignorant of our true selves surged in the 20th century and became common. It's still a commonplace, but it’s changing shape. These days, the bulk of the explanation is done by something else: the ‘dual-process’ model of the brain. We now know that we apprehend the world in two radically opposed ways, employing two fundamentally different modes of thought: ‘System 1’ and ‘System 2’. System 1 is fast; it's intuitive, associative and automatic and it can't be switched off. Its operations involve no sense of intentional control, but it's the "secret author of many of the choices and judgments you make" and it's the hero of Daniel Kahneman's alarming, intellectually stimulating book Thinking, Fast and Slow.

System 2 is slow, deliberate and effortful. Its operations require attention. (To set it going now, ask yourself the question "What is 13 x 27?"). System 2 takes over, rather unwillingly, when things get tricky. It's "the conscious being you call 'I'", and one of Kahneman's main points is that this is a mistake. You're wrong to identify with System 2, for you are also and equally and profoundly System 1. Kahneman compares System 2 to a supporting character who believes herself to be the lead actor and often has little idea of what's going on.

System 2 is slothful, and tires easily (a process called ‘ego depletion’) – so it usually accepts what System 1 tells it. It's often right to do so, because System 1 is for the most part pretty good at what it does; it's highly sensitive to subtle environmental cues, signs of danger, and so on. It does, however, pay a high price for speed. It loves to simplify, to assume WYSIATI (‘what you see is all there is’). It's hopelessly bad at the kind of statistical thinking often required for good decisions, it jumps wildly to conclusions and it's subject to a fantastic range of irrational cognitive biases and interference effects, such as confirmation bias and hindsight bias, to name but two.

The general point about our self-ignorance extends beyond the details of Systems 1 and 2. We're astonishingly susceptible to being influenced by features of our surroundings. One famous (pre-mobile phone) experiment centred on a New York City phone booth. Each time a person came out of the booth after having made a call, an accident was staged – someone dropped all her papers on the pavement. Sometimes a dime had been placed in the phone booth, sometimes not (a dime was then enough to make a call). If there was no dime in the phone booth, only 4% of the exiting callers helped to pick up the papers. If there was a dime, no fewer than 88% helped.

Since then, thousands of other experiments have been conducted, all to the same general effect. We don't know who we are or what we're like, we don't know what we're really doing and we don't know why we're doing it. For example, Judges think they make considered decisions about parole based strictly on the facts of the case. It turns out (to simplify only slightly) that it is their blood-sugar levels really sitting in judgment. If you hold a pencil between your teeth, forcing your mouth into the shape of a smile, you'll find a cartoon funnier than if you hold the pencil pointing forward, by pursing your lips round it in a frown-inducing way.

In an experiment designed to test the ‘anchoring effect’, highly experienced judges were given a description of a shoplifting offence. They were then ‘anchored’ to different numbers by being asked to roll a pair of dice that had been secretly loaded to produce only two totals – three or nine. Finally, they were asked whether the prison sentence for the shoplifting offence should be greater or fewer, in months, than the total showing on the dice. Normally the judges would have made extremely similar judgments, but those who had just rolled nine proposed an average of eight months while those who had rolled three proposed an average of only five months. All were unaware of the anchoring effect.

The same goes for all of us, almost all the time. We think we're smart; we're confident we won't be unconsciously swayed by the high list price of a house. We're wrong. (Kahneman admits his own inability to counter some of these effects.) For example, another systematic error involves ‘duration neglect’ and the ‘peak-end rule’. Looking back on our experience of pain, we prefer a larger, longer amount to a shorter, smaller amount, just so long as the closing stages of the greater pain were easier to bear than the closing stages of the lesser one.
`;

      const PART3 = {
      id: "part3",
      title: "Part 3",
      renderQuestions: (answers) => {
        const wrap = document.createElement("div");

        wrap.appendChild(
          renderMCQBlock(
            {
              title: "Questions 27–31",
              instructions: ["Choose the correct letter, A, B, C or D.", "Write your answers in the gaps."],
              items: [
                {
                  q: 27,
                  text: "The dual process model of the brain is",
                  choices: {
                    A: "The common practice of thinking about two things at the same time.",
                    B: "The conflicting impulses pushing the brain to make both more and less effort.",
                    C: "The feeling of liking and not liking something simultaneously.",
                    D: "The natural tendency to make sense of the world in two different ways.",
                  },
                },
                {
                  q: 28,
                  text: "System 2 takes charge of decision-making when",
                  choices: {
                    A: "When the brain needs a rest.",
                    B: "When more mental effort is required.",
                    C: "When a person feels excessively confident.",
                    D: "When a dangerous situation is developing.",
                  },
                },
                {
                  q: 29,
                  text: "‘Confirmation bias’ is an example of",
                  choices: {
                    A: "System 1 rushing to judgment.",
                    B: "System 1 making a careful judgment.",
                    C: "System 1 making a brave judgment.",
                    D: "System 1 judging a situation based on facts.",
                  },
                },
                {
                  q: 30,
                  text: "The main conclusion of the phone booth experiment was that",
                  choices: {
                    A: "People are more likely to help someone that they are attracted to.",
                    B: "People are more responsive to their environment than they realize.",
                    C: "People are more likely to be helpful if they think they will be rewarded.",
                    D: "People are generally selfish and will always do what is best for themselves.",
                  },
                },
                {
                  q: 31,
                  text: "The ‘anchoring effect’ is the process by which",
                  choices: {
                    A: "Decisions are made using a numerical system.",
                    B: "A subconscious factor may strongly influence our decision-making.",
                    C: "Decisions about prison sentences are made by rolling a dice.",
                    D: "We may emphasize certain factor too much in our decision-making.",
                  },
                },
              ],
            },
            answers
          )
        );

        wrap.appendChild(
          renderTFNGBlock(
            {
              title: "Questions 32–36",
              instructions: [
                "Do the following statements agree with the claims of the writer?",
                "Choose TRUE / NO / NOT GIVEN.",
                "Write your answers in the gaps.",
              ],
              customChoices: ["TRUE", "NO", "NOT GIVEN"],
              items: [
                { q: 32, text: "In general, humans have become less rational over the last 100 years." },
                { q: 33, text: "Most people lack a clear sense of their own personal identity." },
                { q: 34, text: "A person can train themselves to use System 2 most of the time." },
                { q: 35, text: "People who make important decisions should be made aware of the dual-process model." },
                { q: 36, text: "In most everyday situations, people are capable of making calm and rational decisions." },
              ],
            },
            answers
          )
        );

        wrap.appendChild(
          renderEndingsMatchBlock(
            {
              title: "Questions 37–39",
              instructions: [
                "Complete each sentence with the correct ending, A–E, below.",
                "Choose the correct letter for each answer.",
                "Write your answers in the gaps.",
              ],
              endings: {
                A: "feeling a certain way at the conclusion of an experience decides how we remember it.",
                B: "decision-making and judgments are made too quickly.",
                C: "having less energy means we are more likely to succumb to an irrational bias.",
                D: "being sensitive to one’s surroundings is a useful survival skill.",
                E: "wanting more food or drink may distract us from the decision we are making.",
              },
              items: [
                { q: 37, text: "In the course of evolutionary history System 1 has served humans well because" },
                { q: 38, text: "Low blood sugar or tiredness may be factors in decision making because" },
                { q: 39, text: "The ‘peak-end rule’ shows us that" },
              ],
            },
            answers
          )
        );

        wrap.appendChild(
          renderMCQBlock(
            {
              title: "Question 40",
              instructions: ["Choose the correct letter, A, B, C or D.", "Write your answer in the gap."],
              items: [
                {
                  q: 40,
                  text: "What is the writer’s primary purpose in writing this article?",
                  choices: {
                    A: "to introduce their own research to the general reader",
                    B: "to summarize and review a recently published book",
                    C: "to argue against a commonly-held theory",
                    D: "to encourage readers to question their own decision-making processes",
                  },
                },
              ],
            },
            answers
          )
        );

        return wrap;
      },
    };



      return {
        parts: [
          { id: "part1", passageText: PART1_PASSAGE_TEXT, renderQuestions: PART1.renderQuestions },
          { id: "part2", passageText: PART2_PASSAGE_TEXT, renderQuestions: PART2.renderQuestions },
          { id: "part3", passageText: PART3_PASSAGE_TEXT, renderQuestions: PART3.renderQuestions },
        ],
      };
  };

const test1 = {
  listening: {
  "audioSrc": "https://audio.ieltsmock.org/listening_tp_part1.mp3",
  "html": "<!-- PAGE 1 -->\n<div class=\"listen-page\" id=\"listenSec1\">\n<div class=\"listen-block\">\n<div class=\"listen-h\">SECTION 1 — Questions 1–10</div>\n<div class=\"listen-inst\">\n              Complete the notes/table below. Write <b>NO MORE THAN TWO WORDS AND/OR A NUMBER</b> for each answer.\n              Write your answers <b>in the gaps</b>.\n            </div>\n<div class=\"listen-card\">\n<div class=\"listen-card-title\">Transport from Bayswater</div>\n<div class=\"listen-example\">\n<div><b>Example</b></div>\n<div>Destination: <b><i>Harbour City</i></b></div>\n</div>\n<div class=\"listen-notes\">\n<div class=\"note-row\"><span class=\"qnum\">1</span> Express train leaves at <input class=\"l-input\" data-lq=\"1\"/>.</div>\n<div class=\"note-row\"><span class=\"qnum\">2</span> Nearest station is <input class=\"l-input\" data-lq=\"2\"/>.</div>\n<div class=\"note-row\"><span class=\"qnum\">3</span> Number 706 bus goes to <input class=\"l-input\" data-lq=\"3\"/>.</div>\n<div class=\"note-row\"><span class=\"qnum\">4</span> Number <input class=\"l-input small\" data-lq=\"4\"/> bus goes to station.</div>\n<div class=\"note-row\"><span class=\"qnum\">5</span> Earlier bus leaves at <input class=\"l-input\" data-lq=\"5\"/>.</div>\n</div>\n</div>\n<div class=\"listen-card\">\n<div class=\"listen-card-title\">Questions 6–10</div>\n<div class=\"listen-table-wrap\">\n<table class=\"listen-table\">\n<thead>\n<tr>\n<th>Transport</th>\n<th>Cash fare</th>\n<th>Card fare</th>\n</tr>\n</thead>\n<tbody>\n<tr>\n<td>Bus</td>\n<td>$ <span class=\"qnum\">6</span> <input class=\"l-input tiny\" data-lq=\"6\"/></td>\n<td>$1.50</td>\n</tr>\n<tr>\n<td>Train (peak)</td>\n<td>$10</td>\n<td>$10</td>\n</tr>\n<tr>\n<td>Train (off-peak)<br/>\n<span class=\"muted\">before 5pm or after <span class=\"qnum\">7</span> <input class=\"l-input tiny\" data-lq=\"7\"/> pm</span>\n</td>\n<td>$10</td>\n<td>$ <span class=\"qnum\">8</span> <input class=\"l-input tiny\" data-lq=\"8\"/></td>\n</tr>\n<tr>\n<td><span class=\"qnum\">9</span> <input class=\"l-input tiny\" data-lq=\"9\"/> ferry</td>\n<td>$4.50</td>\n<td>$3.55</td>\n</tr>\n<tr>\n<td>Tourist ferry (<span class=\"qnum\">10</span> <input class=\"l-input tiny\" data-lq=\"10\"/>)</td>\n<td>$35</td>\n<td>–</td>\n</tr>\n<tr>\n<td>Tourist ferry (whole day)</td>\n<td>$65</td>\n<td>–</td>\n</tr>\n</tbody>\n</table>\n</div>\n</div>\n</div>\n</div>\n<!-- PAGE 2 -->\n<div class=\"listen-page hidden\" id=\"listenSec2\">\n<div class=\"listen-block\">\n<div class=\"listen-h\">SECTION 2 — Questions 11–20</div>\n<div class=\"listen-card\">\n<div class=\"listen-card-title\">Questions 11–14</div>\n<div class=\"listen-inst\">Which counsellor should you see? Write the correct letter, <b>A, B or C</b>, in the gaps.</div>\n<div class=\"people-box\">\n<div><b>A</b> Louise Bagshaw</div>\n<div><b>B</b> Tony Denby</div>\n<div><b>C</b> Naomi Flynn</div>\n</div>\n<div class=\"note-row\"><span class=\"qnum\">11</span> if you do not have an appointment\n                <select class=\"l-select\" data-lq=\"11\">\n<option value=\"\"></option><option>A</option><option>B</option><option>C</option>\n</select>\n</div>\n<div class=\"note-row\"><span class=\"qnum\">12</span> if it is your first time seeing a counsellor\n                <select class=\"l-select\" data-lq=\"12\">\n<option value=\"\"></option><option>A</option><option>B</option><option>C</option>\n</select>\n</div>\n<div class=\"note-row\"><span class=\"qnum\">13</span> if your concerns are related to anxiety\n                <select class=\"l-select\" data-lq=\"13\">\n<option value=\"\"></option><option>A</option><option>B</option><option>C</option>\n</select>\n</div>\n<div class=\"note-row\"><span class=\"qnum\">14</span> if you are unable to see a counsellor during normal office hours\n                <select class=\"l-select\" data-lq=\"14\">\n<option value=\"\"></option><option>A</option><option>B</option><option>C</option>\n</select>\n</div>\n</div>\n<div class=\"listen-card\">\n<div class=\"listen-card-title\">Questions 15–20</div>\n<div class=\"listen-inst\">Complete the table below. Write <b>NO MORE THAN TWO WORDS</b> for each answer.</div>\n<div class=\"listen-table-wrap\">\n<table class=\"listen-table\">\n<thead>\n<tr>\n<th>Workshop</th>\n<th>Content</th>\n<th>Target group</th>\n</tr>\n</thead>\n<tbody>\n<tr>\n<td>Adjusting</td>\n<td>what you need to succeed academically</td>\n<td><span class=\"qnum\">15</span> <input class=\"l-input tiny\" data-lq=\"15\"/> students</td>\n</tr>\n<tr>\n<td>Getting Organised</td>\n<td>use time effectively, find <span class=\"qnum\">16</span> <input class=\"l-input tiny\" data-lq=\"16\"/> between study and leisure</td>\n<td>all students</td>\n</tr>\n<tr>\n<td>Communicating</td>\n<td>talking with staff, communicating across cultures</td>\n<td>all students, especially <span class=\"qnum\">17</span> <input class=\"l-input tiny\" data-lq=\"17\"/></td>\n</tr>\n<tr>\n<td>Anxiety</td>\n<td><span class=\"qnum\">18</span> <input class=\"l-input tiny\" data-lq=\"18\"/>, breathing techniques, meditation, etc.</td>\n<td>students about to sit exams</td>\n</tr>\n<tr>\n<td><span class=\"qnum\">19</span> <input class=\"l-input tiny\" data-lq=\"19\"/></td>\n<td>staying on track for long periods</td>\n<td><span class=\"qnum\">20</span> <input class=\"l-input tiny\" data-lq=\"20\"/> students only</td>\n</tr>\n</tbody>\n</table>\n</div>\n</div>\n</div>\n</div>\n<!-- PAGE 3 -->\n<div class=\"listen-page hidden\" id=\"listenSec3\">\n<div class=\"listen-block\">\n<div class=\"listen-h\">SECTION 3 — Questions 21–30</div>\n<div class=\"listen-inst\">Complete the notes below. Write <b>NO MORE THAN THREE WORDS</b> for each answer.</div>\n<div class=\"listen-card section3-notes\">\n<!-- BASIC INFO -->\n<div class=\"s3-group\">\n<div class=\"note-row\"><b>Novel:</b> <span class=\"qnum\">21</span> <input class=\"l-input\" data-lq=\"21\"/></div>\n<div class=\"note-row\"><b>Protagonists:</b> Mary Lennox; Colin Craven</div>\n<div class=\"note-row\"><b>Time period:</b> Early in <span class=\"qnum\">22</span> <input class=\"l-input\" data-lq=\"22\"/></div>\n<div class=\"note-row\">\n<b>Plot:</b> Mary → UK — meets Colin who thinks he’ll never be able to\n      <span class=\"qnum\">23</span> <input class=\"l-input\" data-lq=\"23\"/>. They become friends.\n    </div>\n<div class=\"note-row\">\n<b>Point of view:</b> “Omniscient” — narrator knows all about characters’ feelings, opinions and\n      <span class=\"qnum\">24</span> <input class=\"l-input\" data-lq=\"24\"/>.\n    </div>\n<div class=\"note-row\"><b>Audience:</b> Good for children — story simple to follow</div>\n</div>\n<!-- SYMBOLS -->\n<div class=\"s3-group\">\n<div class=\"note-row s3-title\">\n<b>Symbols</b> (physical items that represent\n      <span class=\"qnum\">25</span> <input class=\"l-input\" data-lq=\"25\"/>):\n    </div>\n<div class=\"note-row bullet\">• the robin redbreast</div>\n<div class=\"note-row bullet\">• <span class=\"qnum\">26</span> <input class=\"l-input\" data-lq=\"26\"/></div>\n<div class=\"note-row bullet\">• the portrait of Mistress Craven</div>\n</div>\n<!-- MOTIFS -->\n<div class=\"s3-group\">\n<div class=\"note-row s3-title\"><b>Motifs</b> (patterns in the story):</div>\n<div class=\"note-row bullet\">• the Garden of Eden</div>\n<div class=\"note-row bullet\">\n      • secrecy — metaphorical and literal transition from\n      <span class=\"qnum\">27</span> <input class=\"l-input\" data-lq=\"27\"/>\n</div>\n</div>\n<!-- THEMES -->\n<div class=\"s3-group\">\n<div class=\"note-row s3-title\"><b>Themes:</b> Connections between</div>\n<div class=\"note-row bullet\">\n      • <span class=\"qnum\">28</span> <input class=\"l-input\" data-lq=\"28\"/> and outlook\n    </div>\n<div class=\"note-row bullet\">\n      • <span class=\"qnum\">29</span> <input class=\"l-input\" data-lq=\"29\"/> and well-being\n    </div>\n<div class=\"note-row bullet\">\n      • individuals and the need for <span class=\"qnum\">30</span> <input class=\"l-input\" data-lq=\"30\"/>\n</div>\n</div>\n</div>\n</div>\n</div>\n<!-- PAGE 4 -->\n<div class=\"listen-page hidden\" id=\"listenSec4\">\n<div class=\"listen-block\">\n<div class=\"listen-h\">SECTION 4 — Questions 31–40</div>\n<div class=\"listen-card\">\n<div class=\"listen-card-title\">Questions 31–35</div>\n<div class=\"listen-inst\">Complete the table below. Write <b>ONE WORD ONLY</b> for each answer.</div>\n<div class=\"listen-card-title\">Time Perspectives</div>\n<div class=\"listen-table-wrap\">\n<table class=\"listen-table\">\n<thead>\n<tr><th>Time Zone</th><th>Outlook</th><th>Features &amp; Consequences</th></tr>\n</thead>\n<tbody>\n<tr>\n<td>Past</td>\n<td>Positive</td>\n<td>Remember good times, e.g. birthdays. Keep family records, photo albums, etc.</td>\n</tr>\n<tr>\n<td></td>\n<td><span class=\"qnum\">31</span> <input class=\"l-input tiny\" data-lq=\"31\"/></td>\n<td>Focus on disappointments, failures, bad decisions.</td>\n</tr>\n<tr>\n<td>Present</td>\n<td>Hedonistic</td>\n<td>Live for <span class=\"qnum\">32</span> <input class=\"l-input tiny\" data-lq=\"32\"/>; seek sensation; avoid pain.</td>\n</tr>\n<tr>\n<td></td>\n<td>Fatalistic</td>\n<td>Life is governed by <span class=\"qnum\">33</span> <input class=\"l-input tiny\" data-lq=\"33\"/>, religious beliefs, social conditions. Life’s path can’t be changed.</td>\n</tr>\n<tr>\n<td>Future</td>\n<td><span class=\"qnum\">34</span> <input class=\"l-input tiny\" data-lq=\"34\"/></td>\n<td>Prefer work to play. Don’t give in to temptation.</td>\n</tr>\n<tr>\n<td></td>\n<td>Fatalistic</td>\n<td>Have a strong belief in life after death and importance of <span class=\"qnum\">35</span> <input class=\"l-input tiny\" data-lq=\"35\"/> in life.</td>\n</tr>\n</tbody>\n</table>\n</div>\n</div>\n<div class=\"listen-card\">\n<div class=\"listen-card-title\">Questions 36–40</div>\n<div class=\"listen-inst\">Choose the correct letter, <b>A, B or C</b>.</div>\n<div class=\"mcq\">\n<div class=\"mcq-q\"><span class=\"qnum\">36</span> We are all present hedonists</div>\n<label class=\"mcq-opt\"><input type=\"radio\" name=\"q36\" value=\"A\" data-lq-radio=\"36\"/> A) at school</label>\n<label class=\"mcq-opt\"><input type=\"radio\" name=\"q36\" value=\"B\" data-lq-radio=\"36\"/> B) at birth</label>\n<label class=\"mcq-opt\"><input type=\"radio\" name=\"q36\" value=\"C\" data-lq-radio=\"36\"/> C) while eating and drinking</label>\n</div>\n<div class=\"mcq\">\n<div class=\"mcq-q\"><span class=\"qnum\">37</span> American boys drop out of school at a higher rate than girls because</div>\n<label class=\"mcq-opt\"><input type=\"radio\" name=\"q37\" value=\"A\" data-lq-radio=\"37\"/> A) they need to be in control of the way they learn</label>\n<label class=\"mcq-opt\"><input type=\"radio\" name=\"q37\" value=\"B\" data-lq-radio=\"37\"/> B) they play video games instead of doing school work</label>\n<label class=\"mcq-opt\"><input type=\"radio\" name=\"q37\" value=\"C\" data-lq-radio=\"37\"/> C) they are not as intelligent as girls</label>\n</div>\n<div class=\"mcq\">\n<div class=\"mcq-q\"><span class=\"qnum\">38</span> Present-orientated children</div>\n<label class=\"mcq-opt\"><input type=\"radio\" name=\"q38\" value=\"A\" data-lq-radio=\"38\"/> A) do not realise present actions can have negative future effects</label>\n<label class=\"mcq-opt\"><input type=\"radio\" name=\"q38\" value=\"B\" data-lq-radio=\"38\"/> B) are unable to learn lessons from past mistakes</label>\n<label class=\"mcq-opt\"><input type=\"radio\" name=\"q38\" value=\"C\" data-lq-radio=\"38\"/> C) know what could happen if they do something bad, but do it anyway</label>\n</div>\n<div class=\"mcq\">\n<div class=\"mcq-q\"><span class=\"qnum\">39</span> If Americans had an extra day per week, they would spend it</div>\n<label class=\"mcq-opt\"><input type=\"radio\" name=\"q39\" value=\"A\" data-lq-radio=\"39\"/> A) working harder</label>\n<label class=\"mcq-opt\"><input type=\"radio\" name=\"q39\" value=\"B\" data-lq-radio=\"39\"/> B) building relationships</label>\n<label class=\"mcq-opt\"><input type=\"radio\" name=\"q39\" value=\"C\" data-lq-radio=\"39\"/> C) sharing family meals</label>\n</div>\n<div class=\"mcq\">\n<div class=\"mcq-q\"><span class=\"qnum\">40</span> Understanding how people think about time can help us</div>\n<label class=\"mcq-opt\"><input type=\"radio\" name=\"q40\" value=\"A\" data-lq-radio=\"40\"/> A) become more virtuous</label>\n<label class=\"mcq-opt\"><input type=\"radio\" name=\"q40\" value=\"B\" data-lq-radio=\"40\"/> B) work together better</label>\n<label class=\"mcq-opt\"><input type=\"radio\" name=\"q40\" value=\"C\" data-lq-radio=\"40\"/> C) identify careless or ambitious people</label>\n</div>\n</div>\n</div>\n</div>\n<div class=\"listen-footer\">\n<div class=\"muted\" id=\"listenAutosave\">Autosave: ready</div>\n<button class=\"btn secondary\" id=\"downloadListeningBtn\" type=\"button\">Download Listening answers (JSON)</button>\n<button class=\"btn secondary\" id=\"copyListeningBtn\" type=\"button\">Copy Listening answers</button>\n<button class=\"btn\" id=\"submitListeningBtn\" type=\"button\">Submit Listening now</button>\n</div>"
},
  writing: {
  "task1Type": "Bar chart",
  "task2Type": "Opinion essay",
  "task1Html": "You should spend about 20 minutes on this task.<br/>\n            The graphs below give information about computer ownership as a percentage of the population between 2002 and 2010,\n            and by level of education for the years 2002 and 2010.<br/>\n            Summarise the information by selecting and reporting the main features, and make comparisons where relevant.<br/>\n<b>Write at least 150 words.</b>",
  "task1ImageSrc": "https://static.wixstatic.com/media/6d9e77_cf5acdc4f237496ea2d3611301fe0319~mv2.jpg/v1/fill/w_568,h_650,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/6d9e77_cf5acdc4f237496ea2d3611301fe0319~mv2.jpg",
  "task2Html": "You should spend about 40 minutes on this task.<br/><br/>\n            A person’s worth nowadays seems to be judged according to social status and material possessions.\n            Old-fashioned values, such as honour, kindness and trust, no longer seem important.<br/>\n<b>To what extent do you agree or disagree with this opinion?</b><br/>\n            Give reasons for your answer and include any relevant examples from your own knowledge or experience.<br/>\n<b>Write at least 250 words.</b>",
  "sampleAnswers": {
    "task1": {
      "bandScore": "Band 7.0",
      "explanation": "This model gives a clear overview, highlights the main trends, and makes useful comparisons between education groups. It reaches Band 7 because the organization is strong and the language is mostly accurate, although the data commentary could be even more selective and precise.",
      "sampleAnswer": "The graphs compare computer ownership in the population as a whole between 2002 and 2010 and show how ownership varied by level of education in 2002 and 2010.\n\nOverall, computer ownership increased steadily over the period. It is also clear that people with higher levels of education were more likely to own a computer in both years, although all educational groups saw growth by 2010.\n\nIn the first graph, the proportion of people who owned a computer rose from just over half in 2002 to around three quarters in 2010. The increase was gradual and consistent, with no decline at any point during the period.\n\nThe second graph shows a clear connection between education and computer ownership. In 2002, the lowest ownership levels were among people without a high-school diploma, while postgraduates had the highest figure. By 2010, all groups had experienced growth. Ownership among the most educated groups rose to very high levels, while the least educated groups, although still lower overall, recorded some of the strongest gains. This suggests that computer access became much more widespread over time, even though educational background remained an important factor.",
      "correctedForm": "The graphs illustrate changes in computer ownership from 2002 to 2010 and compare ownership rates across education levels in 2002 and 2010.\n\nOverall, computer ownership rose steadily throughout the period. In addition, ownership was consistently higher among better-educated people, although every educational group experienced an increase by 2010.\n\nAccording to the first graph, the share of the population owning a computer grew from slightly above 50% in 2002 to roughly 75% in 2010. The trend was upward across the whole period.\n\nThe second graph indicates that education level had a strong impact on ownership. In 2002, people without a high-school diploma had the lowest rate, whereas postgraduates recorded the highest. By 2010, ownership had risen in all categories. The more highly educated groups remained at the top, but the lower educational groups also made noticeable progress. Overall, the data shows both expanding computer access and a continuing link between education and computer ownership."
    },
    "task2": {
      "bandScore": "Band 7.5",
      "explanation": "This essay presents a clear position, develops both sides sensibly, and supports the ideas with relevant reasoning. It fits the upper bands because the response is coherent and controlled, though a few arguments could be pushed slightly further for a stronger Band 8 performance.",
      "sampleAnswer": "In modern society, many people appear to be valued according to their wealth, possessions and social position, while traditional qualities such as kindness, trust and honour seem less visible. I partly agree with this statement because material success has become an obvious measure of status, although I do not believe that moral values have lost their importance.\n\nThere is no doubt that modern life encourages people to judge others by external success. Social media, advertising and celebrity culture place great emphasis on income, luxury goods and lifestyle. As a result, expensive houses, fashionable brands and prestigious jobs are often seen as signs that someone is successful or important. In some cases, people form opinions about others before learning anything about their real character.\n\nHowever, this does not mean that old-fashioned values have disappeared. In everyday life, trust, honesty and kindness are still essential. Families depend on them, friendships are built on them, and workplaces function more effectively when people act with integrity. During difficult times, people usually value those who are reliable and supportive rather than those who simply have status or money.\n\nIn my opinion, the main change is that traditional values are less visible in public life. Wealth can be displayed immediately, whereas character is revealed only through long-term behaviour. Because of this, society may seem more materialistic than it really is.\n\nIn conclusion, social status and possessions have become powerful ways of judging people in the modern world, but values such as honour, kindness and trust still define a person’s true worth in the long run.",
      "correctedForm": "Nowadays, many people seem to judge others by social status and material possessions rather than by qualities such as kindness, honour and trust. I partly agree, because visible success has become a powerful social signal, but I do not think traditional values are no longer important.\n\nOn the one hand, material success is often treated as a measure of personal worth. Media and online culture regularly present wealth, influence and luxury as proof of achievement. This encourages people to admire others for what they own rather than for how they behave.\n\nOn the other hand, traditional values still matter deeply in real life. Trust is essential in families and business, kindness strengthens communities, and honour shapes how people are remembered. When people face genuine difficulty, they usually depend on loyal and decent individuals rather than on those with the highest social position.\n\nI believe the real difference is one of visibility. Status can be displayed instantly, while good character becomes clear only over time. For that reason, modern society may look more superficial than it actually is.\n\nTo conclude, social status and possessions have gained too much importance, but values such as trust, honour and kindness still remain the true basis of human worth."
    }
  }
},
  reading: { legacyFactory: readingLegacyFactory1 },
};

const test2 = {
  "listening": {
    "audioSrc": "https://audio.ieltsmock.org/listening_tp_part2.mp3",
    "html": "\n        <div class=\"listen-page\" id=\"listenSec1\">\n          <div class=\"listen-block\">\n            <div class=\"listen-h\">SECTION 1 — Questions 1–10</div>\n\n            <div class=\"listen-card\">\n              <div class=\"listen-card-title\">Questions 1–6</div>\n              <div class=\"listen-inst\">Complete the form below. Write <b>NO MORE THAN TWO WORDS AND/OR A NUMBER</b> for each answer.</div>\n              <div class=\"listen-card-title\">Application Form for use of Library Internet Service</div>\n              <div class=\"listen-example\">\n                <div><b>Example</b></div>\n                <div>Existing cardholder? <b>Yes</b></div>\n              </div>\n              <div class=\"listen-notes\">\n                <div class=\"note-row\">Family name: Milton</div>\n                <div class=\"note-row\"><span class=\"qnum\">1</span> First names: <input data-lq=\"1\" class=\"l-input\"> Jayne</div>\n                <div class=\"note-row\"><span class=\"qnum\">2</span> Address: <input data-lq=\"2\" class=\"l-input\"></div>\n                <div class=\"note-row\">35 Maximilian Way</div>\n                <div class=\"note-row\">Whitfield</div>\n                <div class=\"note-row\"><span class=\"qnum\">3</span> Post Code: <input data-lq=\"3\" class=\"l-input small\"></div>\n                <div class=\"note-row\">Occupation: Nurse</div>\n                <div class=\"note-row\">(works the <span class=\"qnum\">4</span> <input data-lq=\"4\" class=\"l-input small\">)</div>\n                <div class=\"note-row\">Home phone: N/A</div>\n                <div class=\"note-row\">Mobile: 0412 214 418</div>\n                <div class=\"note-row\"><span class=\"qnum\">5</span> Type of ID: <input data-lq=\"5\" class=\"l-input\"></div>\n                <div class=\"note-row\">ID number: AZ 1985331</div>\n                <div class=\"note-row\">Date of Birth: 25th <span class=\"qnum\">6</span> <input data-lq=\"6\" class=\"l-input small\"></div>\n              </div>\n            </div>\n\n            <div class=\"listen-card\">\n              <div class=\"listen-card-title\">Questions 7 and 8</div>\n              <div class=\"listen-inst\">What will the woman use the internet for? Choose <b>TWO</b> letters, A–E. Type one letter in each box.</div>\n              <div class=\"endings-box\">\n                <div><b>A</b> trade &amp; exchange</div>\n                <div><b>B</b> research</div>\n                <div><b>C</b> email</div>\n                <div><b>D</b> social networking</div>\n                <div><b>E</b> job vacancies</div>\n              </div>\n              <div class=\"note-row\"><span class=\"qnum\">7</span> First choice: <input data-lq=\"7\" class=\"l-input tiny\"></div>\n              <div class=\"note-row\"><span class=\"qnum\">8</span> Second choice: <input data-lq=\"8\" class=\"l-input tiny\"></div>\n            </div>\n\n            <div class=\"listen-card\">\n              <div class=\"listen-card-title\">Questions 9 and 10</div>\n              <div class=\"listen-inst\">Write <b>NO MORE THAN TWO WORDS AND/OR A NUMBER</b> for each answer.</div>\n              <div class=\"note-row\"><span class=\"qnum\">9</span> How much does it cost to register as an internet user? <input data-lq=\"9\" class=\"l-input\"></div>\n              <div class=\"note-row\"><span class=\"qnum\">10</span> What is the maximum amount of time allowed per single daily internet session? <input data-lq=\"10\" class=\"l-input\"></div>\n            </div>\n          </div>\n        </div>\n\n        <div class=\"listen-page hidden\" id=\"listenSec2\">\n          <div class=\"listen-block\">\n            <div class=\"listen-h\">SECTION 2 — Questions 11–20</div>\n\n            <div class=\"listen-card\">\n              <div class=\"listen-card-title\">Questions 11–15</div>\n              <div class=\"listen-inst\">Choose the correct letter, <b>A, B or C</b>.</div>\n              <div class=\"mcq\">\n                <div class=\"mcq-q\"><span class=\"qnum\">11</span> The guided bushwalk is suitable for</div>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q11\" value=\"A\" data-lq-radio=\"11\"> A) adults only</label>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q11\" value=\"B\" data-lq-radio=\"11\"> B) children over 12 and adults</label>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q11\" value=\"C\" data-lq-radio=\"11\"> C) children over 8 accompanied by a parent</label>\n              </div>\n              <div class=\"mcq\">\n                <div class=\"mcq-q\"><span class=\"qnum\">12</span> On the bird observation outing, it is recommended that you have</div>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q12\" value=\"A\" data-lq-radio=\"12\"> A) waterproof footwear</label>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q12\" value=\"B\" data-lq-radio=\"12\"> B) a bird identification book</label>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q12\" value=\"C\" data-lq-radio=\"12\"> C) binoculars</label>\n              </div>\n              <div class=\"mcq\">\n                <div class=\"mcq-q\"><span class=\"qnum\">13</span> For the trip to the sand dunes, a company will donate</div>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q13\" value=\"A\" data-lq-radio=\"13\"> A) water</label>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q13\" value=\"B\" data-lq-radio=\"13\"> B) tools</label>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q13\" value=\"C\" data-lq-radio=\"13\"> C) gloves</label>\n              </div>\n              <div class=\"mcq\">\n                <div class=\"mcq-q\"><span class=\"qnum\">14</span> The bush tucker excursion will cost (per person)</div>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q14\" value=\"A\" data-lq-radio=\"14\"> A) $15</label>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q14\" value=\"B\" data-lq-radio=\"14\"> B) $12</label>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q14\" value=\"C\" data-lq-radio=\"14\"> C) $7</label>\n              </div>\n              <div class=\"mcq\">\n                <div class=\"mcq-q\"><span class=\"qnum\">15</span> The deadline to register for the bush tucker outing is</div>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q15\" value=\"A\" data-lq-radio=\"15\"> A) 25 November</label>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q15\" value=\"B\" data-lq-radio=\"15\"> B) 15 November</label>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q15\" value=\"C\" data-lq-radio=\"15\"> C) 10 November</label>\n              </div>\n            </div>\n\n            <div class=\"listen-card\">\n              <div class=\"listen-card-title\">Questions 16–20</div>\n              <div class=\"listen-inst\">Complete the table below. Write <b>NO MORE THAN TWO WORDS AND/OR A NUMBER</b> for each answer.</div>\n              <div class=\"listen-table-wrap\">\n                <table class=\"listen-table\">\n                  <thead><tr><th>Activity</th><th>Leader</th><th>Date</th><th>Venue</th><th>Time</th></tr></thead>\n                  <tbody>\n                    <tr><td>Bush walk</td><td>Glenn Ford</td><td><span class=\"qnum\">16</span> <input data-lq=\"16\" class=\"l-input tiny\"></td><td>Springvale</td><td><span class=\"qnum\">17</span> <input data-lq=\"17\" class=\"l-input tiny\">–1pm</td></tr>\n                    <tr><td>Bird watching</td><td>Joy Black, club <span class=\"qnum\">18</span> <input data-lq=\"18\" class=\"l-input tiny\"></td><td>10 September</td><td>Camford</td><td>4.30–6.30pm</td></tr>\n                    <tr><td>Sand dunes</td><td>Rex Rose</td><td>26 November</td><td><span class=\"qnum\">19</span> <input data-lq=\"19\" class=\"l-input tiny\"></td><td>8.30–10.30am</td></tr>\n                    <tr><td>Bush tucker</td><td>Jim Kerr, ranger</td><td>3 December</td><td>Carson Hills</td><td>10am–<span class=\"qnum\">20</span> <input data-lq=\"20\" class=\"l-input tiny\"></td></tr>\n                  </tbody>\n                </table>\n              </div>\n            </div>\n          </div>\n        </div>\n\n        <div class=\"listen-page hidden\" id=\"listenSec3\">\n          <div class=\"listen-block\">\n            <div class=\"listen-h\">SECTION 3 — Questions 21–30</div>\n            <div class=\"listen-card\">\n              <div class=\"listen-card-title\">Questions 21–25</div>\n              <div class=\"listen-inst\">Complete the sentences below. Write <b>NO MORE THAN TWO WORDS</b> for each answer.</div>\n              <div class=\"note-row\"><span class=\"qnum\">21</span> Students must follow <input data-lq=\"21\" class=\"l-input\"> to prevent accidents in the lab.</div>\n              <div class=\"note-row\"><span class=\"qnum\">22</span> The students have not been using <input data-lq=\"22\" class=\"l-input\"> while in the lab.</div>\n              <div class=\"note-row\"><span class=\"qnum\">23</span> Students cannot eat or drink until <input data-lq=\"23\" class=\"l-input\"> is finished and they have washed their hands.</div>\n              <div class=\"note-row\"><span class=\"qnum\">24</span> Tessa should tie her hair back to avoid danger when she is working with a <input data-lq=\"24\" class=\"l-input\"> or chemicals.</div>\n              <div class=\"note-row\"><span class=\"qnum\">25</span> Students must wear long sleeves and shoes made of <input data-lq=\"25\" class=\"l-input\"> in the lab.</div>\n            </div>\n\n            <div class=\"listen-card\">\n              <div class=\"listen-card-title\">Questions 26–28</div>\n              <div class=\"listen-inst\">Choose the correct letter, <b>A, B or C</b>.</div>\n              <div class=\"mcq\">\n                <div class=\"mcq-q\"><span class=\"qnum\">26</span> Which student is currently using an appropriate notebook?</div>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q26\" value=\"A\" data-lq-radio=\"26\"> A) Vincent</label>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q26\" value=\"B\" data-lq-radio=\"26\"> B) Tessa</label>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q26\" value=\"C\" data-lq-radio=\"26\"> C) Neither student</label>\n              </div>\n              <div class=\"mcq\">\n                <div class=\"mcq-q\"><span class=\"qnum\">27</span> The tutor says that writing observations in complete sentences</div>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q27\" value=\"A\" data-lq-radio=\"27\"> A) is often not a good use of time</label>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q27\" value=\"B\" data-lq-radio=\"27\"> B) makes them easier to interpret later</label>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q27\" value=\"C\" data-lq-radio=\"27\"> C) means that others can understand them</label>\n              </div>\n              <div class=\"mcq\">\n                <div class=\"mcq-q\"><span class=\"qnum\">28</span> The students must write dates</div>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q28\" value=\"A\" data-lq-radio=\"28\"> A) next to each drawing</label>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q28\" value=\"B\" data-lq-radio=\"28\"> B) next to each written section</label>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q28\" value=\"C\" data-lq-radio=\"28\"> C) next to each drawing and written section</label>\n              </div>\n            </div>\n\n            <div class=\"listen-card\">\n              <div class=\"listen-card-title\">Questions 29 and 30</div>\n              <div class=\"listen-inst\">Which <b>TWO</b> things must be included in the conclusion to the experiment? Type one letter in each box.</div>\n              <div class=\"endings-box\">\n                <div><b>A</b> the questions investigated</div>\n                <div><b>B</b> the solutions to the questions</div>\n                <div><b>C</b> the student’s own thoughts about the experiment</div>\n                <div><b>D</b> the length of time spent on the experiment</div>\n                <div><b>E</b> the student’s signature</div>\n              </div>\n              <div class=\"note-row\"><span class=\"qnum\">29</span> First choice: <input data-lq=\"29\" class=\"l-input tiny\"></div>\n              <div class=\"note-row\"><span class=\"qnum\">30</span> Second choice: <input data-lq=\"30\" class=\"l-input tiny\"></div>\n            </div>\n          </div>\n        </div>\n\n        <div class=\"listen-page hidden\" id=\"listenSec4\">\n          <div class=\"listen-block\">\n            <div class=\"listen-h\">SECTION 4 — Questions 31–40</div>\n            <div class=\"listen-card\">\n              <div class=\"listen-card-title\">Questions 31–40</div>\n              <div class=\"listen-inst\">Complete the notes below. Write <b>NO MORE THAN TWO WORDS AND/OR A NUMBER</b> for each answer.</div>\n              <div class=\"listen-card-title\">Climate change</div>\n              <div class=\"note-row\"><b>HUMAN FACTORS</b></div>\n              <div class=\"note-row bullet\">• Cutting down trees for <span class=\"qnum\">31</span> <input data-lq=\"31\" class=\"l-input\"></div>\n              <div class=\"note-row bullet\">• Industrial Revolution</div>\n              <div class=\"note-row bullet\">• <span class=\"qnum\">32</span> <input data-lq=\"32\" class=\"l-input\"></div>\n              <div class=\"note-row bullet\">• Increase in population → deforestation</div>\n              <div class=\"note-row\"><b>KNOWN EFFECTS</b></div>\n              <div class=\"note-row bullet\">• Over previous 130 yrs: temp. ↑ by 0.6 °C</div>\n              <div class=\"note-row bullet\">• Since Ind. Rev.: CO2 ↑ by 30% &amp; Methane ↑ by <span class=\"qnum\">33</span> <input data-lq=\"33\" class=\"l-input tiny\"> (from mining, animals, rice paddies)</div>\n              <div class=\"note-row bullet\">• N2O ↑ (from <span class=\"qnum\">34</span> <input data-lq=\"34\" class=\"l-input\"> esp. fertiliser; waste management; car exhausts)</div>\n              <div class=\"note-row bullet\">• Greenhouse Effect: gases form <span class=\"qnum\">35</span> <input data-lq=\"35\" class=\"l-input\"> → heat trapped → Earth warms up</div>\n              <div class=\"note-row\"><b>FUTURE EFFECTS</b></div>\n              <div class=\"listen-table-wrap\">\n                <table class=\"listen-table\">\n                  <thead><tr><th>Sea level</th><th>Number of people at risk</th></tr></thead>\n                  <tbody>\n                    <tr><td>1998 levels</td><td><span class=\"qnum\">36</span> <input data-lq=\"36\" class=\"l-input tiny\"></td></tr>\n                    <tr><td>+50 cm</td><td>92 million</td></tr>\n                    <tr><td>+1 metre</td><td><span class=\"qnum\">37</span> <input data-lq=\"37\" class=\"l-input tiny\"></td></tr>\n                  </tbody>\n                </table>\n              </div>\n              <div class=\"note-row bullet\">2. Change in <span class=\"qnum\">38</span> <input data-lq=\"38\" class=\"l-input\"> → more arid areas → population movement to cities</div>\n              <div class=\"note-row bullet\">3. Increase in pests and <span class=\"qnum\">39</span> <input data-lq=\"39\" class=\"l-input\"> e.g. malaria</div>\n              <div class=\"note-row bullet\">4. Change in ecosystems: shift in <span class=\"qnum\">40</span> <input data-lq=\"40\" class=\"l-input\"> – some die, others multiply</div>\n            </div>\n          </div>\n        </div>\n\n        <div class=\"listen-footer\">\n          <div class=\"muted\" id=\"listenAutosave\">Autosave: ready</div>\n          <button class=\"btn secondary\" id=\"downloadListeningBtn\" type=\"button\">Download Listening answers (JSON)</button>\n          <button class=\"btn secondary\" id=\"copyListeningBtn\" type=\"button\">Copy Listening answers</button>\n          <button class=\"btn\" id=\"submitListeningBtn\" type=\"button\">Submit Listening now</button>\n        </div>\n      "
  },
  "writing": {
    "task1Type": "Line graph",
    "task2Type": "Discussion essay",
    "task1Html": "You should spend about 20 minutes on this task.<br>\nThe graph below shows the proportion of four different materials that were recycled from 1982 to 2010 in a particular country.<br>\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.<br>\n<b>Write at least 150 words.</b>",
    "task1ImageSrc": "https://www.ieltsbuddy.com/images/ielts-line-graph-recycling-different-materials-21962309.jpg",
    "task2Html": "You should spend about 40 minutes on this task.<br><br>\nSome parents and teachers think that children's behavior should be strictly controlled. While some think that children should be free to behave.<br>\n<b>Discuss both views and give your opinion.</b><br>\nWrite at least 250 words.",
    "sampleAnswers": {
      "task1": {
        "bandScore": "Band 7.0",
        "explanation": "This report identifies the key trends clearly and compares the four materials rather than describing every point mechanically. It reaches Band 7 because the overview is effective and the language is controlled, although some data support could be slightly more specific.",
        "sampleAnswer": "The line graph shows the proportion of four materials that were recycled in one country between 1982 and 2010.\n\nOverall, paper and cardboard remained the most widely recycled material for most of the period, although its figure declined slightly at the end. By contrast, aluminium cans showed the most dramatic growth. Glass recovered after an early fall, while plastics remained by far the least recycled material throughout.\n\nPaper and cardboard started at around 65% in 1982 and rose to a peak of about 80% in the mid-1990s. After that, the figure fell gradually, finishing at roughly 70% in 2010. Glass began at approximately 50%, dropped to about 40% by 1990, and then climbed steadily to around 60% at the end of the period.\n\nAluminium cans recorded the fastest growth. Recycling began at a very low level, at only a few percent, but rose sharply after 1990 and reached about 45% by 2010. Plastics changed the least. Despite a small increase over time, the figure stayed low and ended at under 10%.\n\nIn summary, paper and cardboard dominated recycling overall, but aluminium experienced the strongest upward trend, while plastics remained comparatively insignificant.",
        "correctedForm": "The graph illustrates the percentage of four materials that were recycled in a particular country from 1982 to 2010.\n\nOverall, paper and cardboard had the highest recycling rates during most of the period, although their figure declined slightly in the later years. Aluminium cans, in contrast, rose sharply, while plastics remained the least recycled material throughout. Glass fell at first but then recovered steadily.\n\nPaper and cardboard started at about 65% in 1982 and peaked at roughly 80% in 1994 before decreasing to around 70% by 2010. Glass began at approximately 50%, dropped to about 40% by 1990, and then increased gradually to end at around 60%.\n\nAluminium cans showed the most significant growth. Their recycling rate was very low at the beginning, but it rose rapidly after 1990 and reached about 45% by the end of the period. Plastics, by comparison, saw only a slight increase and finished at under 10%.\n\nOverall, the graph shows strong long-term growth in aluminium and a continuing dominance of paper and cardboard, whereas plastics remained far less commonly recycled."
      },
      "task2": {
        "bandScore": "Band 7.5",
        "explanation": "This essay covers both views clearly and gives a balanced personal position. It reaches Band 7.5 because the ideas are logically developed and supported, though some arguments could be illustrated even more fully for a higher band.",
        "sampleAnswer": "Some people believe that children should be raised under strict control, while others argue that they should be given more freedom. This essay will discuss both perspectives before explaining why I believe children need freedom, but within reasonable boundaries.\n\nThose who support strict control argue that children are not mature enough to make sensible decisions on their own. Clear rules can protect them from danger, encourage discipline and help them understand acceptable behavior. For example, school rules and parental limits on screen time can prevent harmful habits and create a more stable environment for learning. Without guidance, some children may struggle to develop self-control.\n\nOn the other hand, people who favour freedom believe that children learn best by making choices and experiencing the consequences of those choices. If every action is controlled, children may become dependent, insecure or less creative. Freedom can also help them develop confidence, independence and problem-solving skills, which are essential in adult life.\n\nIn my opinion, children should not be either completely controlled or completely free. They need a structured environment, but they also need opportunities to express themselves and make age-appropriate decisions. Parents and teachers should therefore provide firm guidance while gradually increasing freedom as children become more responsible.\n\nIn conclusion, strict control can protect children and teach discipline, whereas freedom helps them grow into independent individuals. A balanced approach is the most effective way to support healthy development.",
        "correctedForm": "Some parents and teachers believe that children's behaviour should be tightly controlled, whereas others think children should have greater freedom. Both views have merit, but I believe the best approach is to combine clear limits with increasing independence.\n\nSupporters of strict control argue that children need firm guidance because they are still developing judgement and self-discipline. Rules at home and school can protect them from harm, establish boundaries and promote responsible behaviour. For instance, limits on internet use or school attendance can prevent poor habits from forming early.\n\nBy contrast, those who favour freedom argue that children must learn to think and act for themselves. If adults control every decision, children may become overly dependent and less confident. Freedom allows them to make choices, learn from mistakes and build independence.\n\nIn my view, neither extreme is ideal. Children need structure, but they also need room to grow. Adults should set clear rules on important matters while allowing children to make smaller decisions appropriate to their age and maturity.\n\nTo conclude, strict control offers safety and discipline, while freedom encourages confidence and responsibility. A balanced combination of both is the most effective way to guide children's behaviour."
      }
    }
  },
  "reading": {
    "parts": [
      {
        "id": "part1",
        "passageText": "The MAGIC of KEFIR\n\nA The shepherds of the North Caucasus region of Europe were only trying to transport milk the best way they knew how – in leather pouches strapped to the side of donkeys – when they made a significant discovery. A fermentation process would sometimes inadvertently occur en route, and when the pouches were opened up on arrival they would no longer contain milk but rather a pungent, effervescent, low-alcoholic substance instead. This unexpected development was a blessing in disguise. The new drink – which acquired the name kefir – turned out to be a health tonic, a naturally-preserved dairy product and a tasty addition to our culinary repertoire.\n\nB Although their exact origin remains a mystery, we do know that yeast-based kefir grains have always been at the root of the kefir phenomenon. These grains are capable of a remarkable feat: in contradistinction to most other items you might find in a grocery store, they actually expand and propagate with use. This is because the grains, which are granular to the touch and bear a slight resemblance to cauliflower rosettes, house active cultures that feed on lactose when added to milk. Consequently, a bigger problem for most kefir drinkers is not where to source new kefir grains, but what to do with the ones they already have!\n\nC The great thing about kefir is that it does not require a manufacturing line in order to be produced. Grains can be simply thrown in with a batch of milk for ripening to begin. The mixture then requires a cool, dark place to live and grow, with periodic unsettling to prevent clumping (Caucasus inhabitants began storing the concoction in animal-skin satchels on the back of doors – every time someone entered the room the mixture would get lightly shaken). After about 24 hours the yeast cultures in the grains have multiplied and devoured most of the milk sugars, and the final product is then ready for human consumption.\n\nD Nothing compares to a person’s first encounter with kefir. The smooth, uniform consistency rolls over the tongue in a manner akin to liquefied yogurt. The sharp, tart pungency of unsweetened yogurt is there too, but there is also a slight hint of effervescence, something most users will have previously associated only with mineral waters, soda or beer. Kefir also comes with a subtle aroma of yeast, and depending on the type of milk and ripening conditions, ethanol content can reach up to two or three percent – about on par with a decent lager – although you can expect around 0.8 to one per cent for a typical day-old preparation. This can bring out a tiny edge of alcohol in the kefir’s flavour.\n\nE Although it has prevailed largely as a fermented milk drink, over the years kefir has acquired a number of other uses. Many bakers use it instead of starter yeast in the preparation of sourdough, and the tangy flavour also makes kefir an ideal buttermilk substitute in pancakes. Kefir also accompanies sour cream as one of the main ingredients in cold beetroot soup and can be used in lieu of regular cow’s milk on granola or cereal. As a way to keep their digestive systems fine-tuned, athletes sometimes combine kefir with yoghurt in protein shakes.\n\nF Associated for centuries with pictures of Slavic babushkas clutching a shawl in one hand and a cup of kefir in the other, the unassuming beverage has become a minor celebrity of the nascent health food movement in the contemporary West. Every day, more studies pour out supporting the benefits of a diet high in probiotics. This trend toward consuming probiotics has engulfed the leisure classes in these countries to the point that it is poised to become, according to some commentators, “the next multivitamin”. These days the word kefir is consequently more likely to bring to mind glamorous, yoga mat-toting women from Los Angeles than austere visions of blustery Eastern Europe.\n\nG Kefir’s rise in popularity has encouraged producers to take short cuts or alter the production process. Some home users have omitted the ripening and culturation process while commercial dealers often add thickeners, stabilisers and sweeteners. But the beauty of kefir is that, at its healthiest and tastiest, it is a remarkably affordable, uncluttered process, as any accidental invention is bound to be. All that is necessary are some grains, milk and a little bit of patience. A return to the unadulterated kefir-making of old is in everyone’s interest.",
        "blocks": [
          {
            "type": "headings",
            "title": "Questions 1–7",
            "instructions": [
              "Reading Passage 1 has seven paragraphs, A–G.",
              "Choose the correct heading for each paragraph from the list of headings below.",
              "Write the correct number, i–x, in the gaps."
            ],
            "listTitle": "List of Headings",
            "headings": [
              {
                "value": "i",
                "label": "A unique sensory experience"
              },
              {
                "value": "ii",
                "label": "Getting back to basics"
              },
              {
                "value": "iii",
                "label": "The gift that keeps on giving"
              },
              {
                "value": "iv",
                "label": "Variations in alcohol content"
              },
              {
                "value": "v",
                "label": "Old methods of transportation"
              },
              {
                "value": "vi",
                "label": "Culinary applications"
              },
              {
                "value": "vii",
                "label": "Making kefir"
              },
              {
                "value": "viii",
                "label": "A fortunate accident"
              },
              {
                "value": "ix",
                "label": "Kefir gets an image makeover"
              },
              {
                "value": "x",
                "label": "Ways to improve taste"
              }
            ],
            "questions": [
              {
                "q": 1,
                "paragraph": "Section A"
              },
              {
                "q": 2,
                "paragraph": "Section B"
              },
              {
                "q": 3,
                "paragraph": "Section C"
              },
              {
                "q": 4,
                "paragraph": "Section D"
              },
              {
                "q": 5,
                "paragraph": "Section E"
              },
              {
                "q": 6,
                "paragraph": "Section F"
              },
              {
                "q": 7,
                "paragraph": "Section G"
              }
            ]
          },
          {
            "type": "shortAnswer",
            "title": "Questions 8–11",
            "instructions": [
              "Answer the questions below using NO MORE THAN TWO WORDS from the passage for each answer.",
              "Write your answers in the gaps."
            ],
            "questions": [
              {
                "q": 8,
                "text": "What do kefir grains look like?"
              },
              {
                "q": 9,
                "text": "What needs to happen to kefir while it is ripening?"
              },
              {
                "q": 10,
                "text": "What will the yeast cultures have consumed before kefir is ready to drink?"
              },
              {
                "q": 11,
                "text": "The texture of kefir in the mouth is similar to what?"
              }
            ]
          },
          {
            "type": "multiTextChoices",
            "title": "Questions 12 and 13",
            "instructions": [
              "Which TWO products are NOT mentioned as things which kefir can replace?",
              "Choose TWO letters, A–E. Type one letter in each box."
            ],
            "choices": [
              {
                "letter": "A",
                "text": "Ordinary cow’s milk"
              },
              {
                "letter": "B",
                "text": "Buttermilk"
              },
              {
                "letter": "C",
                "text": "Sour cream"
              },
              {
                "letter": "D",
                "text": "Starter yeast"
              },
              {
                "letter": "E",
                "text": "Yoghurt"
              }
            ],
            "items": [
              {
                "q": 12,
                "text": "First answer"
              },
              {
                "q": 13,
                "text": "Second answer"
              }
            ]
          }
        ]
      },
      {
        "id": "part2",
        "passageText": "FOOD FOR THOUGHT\n\nA Why not eat insects? So asked British entomologist Vincent M. Holt in the title of his 1885 treatise on the benefits of what he named entomophagy – the consumption of insects (and similar creatures) as a food source. The prospect of eating dishes such as “wireworm sauce” and “slug soup” failed to garner favour amongst those in the stuffy, proper, Victorian social milieu of his time, however, and Holt’s visionary ideas were considered at best eccentric, at worst an offense to every refined palate. Anticipating such a reaction, Holt acknowledged the difficulty in unseating deep-rooted prejudices against insect cuisine, but quietly asserted his confidence that “we shall some day quite gladly cook and eat them”.\n\nB It has taken nearly 150 years but an eclectic Western-driven movement has finally mounted around the entomophagic cause. In Los Angeles and other cosmopolitan Western cities, insects have been caught up in the endless pursuit of novel and authentic delicacies. “Eating grasshoppers is a thing you do here”, bug-supplier Bricia Lopez has explained. “There’s more of a ‘cool’ factor involved.” Meanwhile, the Food and Agricultural Organization has considered a policy paper on the subject, initiated farming projects in Laos, and set down plans for a world congress on insect farming in 2013.\n\nC Eating insects is not a new phenomenon. In fact, insects and other such creatures are already eaten in 80 per cent of the world’s countries, prepared in customary dishes ranging from deep-fried tarantula in Cambodia to bowls of baby bees in China. With the specialist knowledge that Western companies and organisations can bring to the table, however, these hand-prepared delicacies have the potential to be produced on a scale large enough to lower costs and open up mass markets. A new American company, for example, is attempting to develop pressurisation machines that would de-shell insects and make them available in the form of cutlets. According to the entrepreneur behind the company, Matthew Krisiloff, this will be the key to pleasing the uninitiated palate.\n\nD Insects certainly possess some key advantages over traditional Western meat sources. According to research findings from Professor Arnold van Huis, a Dutch entomologist, breeding insects results in far fewer noxious by-products. Insects produce less ammonia than pig and poultry farming, ten times less methane than livestock, and 300 times less nitrous oxide. Huis also notes that insects – being cold-blooded creatures – can convert food to protein at a rate far superior to that of cows, since the latter exhaust much of their energy just keeping themselves warm.\n\nE Although insects are sometimes perceived by Westerners as unhygienic or disease-ridden, they are a reliable option in light of recent global epidemics. Because bugs are genetically distant from humans, species-hopping diseases such as swine flu or mad cow disease are much less likely to start or spread amongst grasshoppers or slugs than in poultry and cattle. Furthermore, the squalid, cramped quarters that encourage diseases to propagate among many animal populations are actually the residence of choice for insects, which thrive in such conditions.\n\nF Then, of course, there are the commercial gains. As FAO Forestry Manager Patrick Durst notes, in developing countries many rural people and traditional forest dwellers have remarkable knowledge about managing insect populations to produce food. Until now, they have only used this knowledge to meet their own subsistence needs, but Durst believes that, with the adoption of modern technology and improved promotional methods, opportunities to expand the market to new consumers will flourish. This could provide a crucial step into the global economic arena for those primarily rural, impoverished populations who have been excluded from the rise of manufacturing and large-scale agriculture.\n\nG Nevertheless, much stands in the way of the entomophagic movement. One problem is the damage that has been caused, and continues to be caused, by Western organisations prepared to kill off grasshoppers and locusts – complete food proteins – in favour of preserving the incomplete protein crops of millet, wheat, barley and maize. Entomologist Florence Dunkel has described the consequences of such interventions. While examining children’s diets as a part of her field work in Mali, Dunkel discovered that a protein deficiency syndrome called kwashiorkor was increasing in incidence. Children in the area were once protected against kwashiorkor by a diet high in grasshoppers, but these had become unsafe to eat after pesticide use in the area increased.\n\nH A further issue is the persistent fear many Westerners still have about eating insects. “The problem is the ick factor—the eyes, the wings, the legs,” Krisiloff has said. “It’s not as simple as hiding it in a bug nugget. People won’t accept it beyond the novelty. When you think of a chicken, you think of a chicken breast, not the eyes, wings, and beak.” For Marcel Dicke, the key lies in camouflaging the fact that people are eating insects at all. Insect flour is one of his propositions, as is changing the language of insect cuisine. “If you say it’s mealworms, it makes people think of ringworm”, he notes. “So stop saying ‘worm’. If we use Latin names, say it’s a Tenebrio quiche, it sounds much more fancy”. For Krisiloff, Dicke and others, keeping quiet about the gritty reality of our food is often the best approach.\n\nI It is yet to be seen if history will truly redeem Vincent Holt and his suggestion that British families should gather around their dining tables for a breakfast of “moths on toast”. It is clear, however, that entomophagy, far from being a kooky sideshow to the real business of food production, has much to offer in meeting the challenges that global societies in the 21st century will face.",
        "blocks": [
          {
            "type": "headings",
            "title": "Questions 14–21",
            "instructions": [
              "Reading Passage 2 has nine paragraphs, A–I.",
              "Choose the correct heading for paragraphs A–H from the list of headings below.",
              "Write the correct number, i–xi, in the gaps."
            ],
            "listTitle": "List of Headings",
            "headings": [
              {
                "value": "i",
                "label": "A historical delicacy"
              },
              {
                "value": "ii",
                "label": "The poor may benefit"
              },
              {
                "value": "iii",
                "label": "Presentation is key to changing attitudes"
              },
              {
                "value": "iv",
                "label": "Environmentally friendly production"
              },
              {
                "value": "v",
                "label": "Tradition meets technology"
              },
              {
                "value": "vi",
                "label": "A cultural pioneer"
              },
              {
                "value": "vii",
                "label": "Western practices harm locals"
              },
              {
                "value": "viii",
                "label": "Good source of nutrients"
              },
              {
                "value": "ix",
                "label": "Growing popularity"
              },
              {
                "value": "x",
                "label": "A healthy choice"
              },
              {
                "value": "xi",
                "label": "A safety risk"
              }
            ],
            "questions": [
              {
                "q": 14,
                "paragraph": "Section A"
              },
              {
                "q": 15,
                "paragraph": "Section B"
              },
              {
                "q": 16,
                "paragraph": "Section C"
              },
              {
                "q": 17,
                "paragraph": "Section D"
              },
              {
                "q": 18,
                "paragraph": "Section E"
              },
              {
                "q": 19,
                "paragraph": "Section F"
              },
              {
                "q": 20,
                "paragraph": "Section G"
              },
              {
                "q": 21,
                "paragraph": "Section H"
              }
            ]
          },
          {
            "type": "sentenceGaps",
            "title": "Questions 22–26",
            "instructions": [
              "Complete the notes below.",
              "Choose NO MORE THAN THREE WORDS from the passage for each answer."
            ],
            "items": [
              {
                "q": 22,
                "text": "Insects use food intake economically in the production of protein as they waste less",
                "tail": "."
              },
              {
                "q": 23,
                "text": "Traditional knowledge could be combined with modern methods for mass production instead of just covering",
                "tail": "."
              },
              {
                "q": 24,
                "text": "This could help",
                "tail": " people gain access to world markets."
              },
              {
                "q": 25,
                "text": "Due to increased",
                "tail": ", more children in Mali are suffering from"
              },
              {
                "q": 26,
                "inlineWithPrevious": true,
                "text2": "."
              }
            ]
          }
        ]
      },
      {
        "id": "part3",
        "passageText": "Love stories\n\n“Love stories” are often associated – at least in the popular imagination – with fairy tales, adolescent day dreams, Disney movies and other frivolous pastimes. For psychologists developing taxonomies of affection and attachment, however, this is an area of rigorous academic pursuit. Beginning in the early 1970s with the groundbreaking contributions of John Alan Lee, researchers have developed classifications that they believe better characterise our romantic predispositions. This involves examining not a single, universal, emotional expression (“love”), but rather a series of divergent behaviours and narratives that each has an individualised purpose, desired outcome and state of mind. Lee’s gritty methodology painstakingly involved participants matching 170 typical romantic encounters with nearly 1500 possible reactions. The patterns unknowingly expressed by respondents culminated in a taxonomy of six distinct love “styles” that continue to inform research in the area forty years later.\n\nThe first of these styles – eros – is closely tied in with images of romantic love that are promulgated in Western popular culture. Characteristic of this style is a passionate emotional intensity, a strong physical magnetism – as if the two partners were literally being “pulled” together – and a sense of inevitability about the relationship. A related but more frantic style of love called mania involves an obsessive, compulsive attitude toward one’s partner. Vast swings in mood from ecstasy to agony – dependent on the level of attention a person is receiving from his or her partner – are typical of manic love.\n\nTwo styles were much more subdued, however. Storge is a quiet, companionate type of loving – “love by evolution” rather than “love by revolution”, according to some theorists. Relationships built on a foundation of platonic affection and caring are archetypal of storge. When care is extended to a sacrificial level of doting, however, it becomes another style – agape. In an agape relationship one partner becomes a “caretaker”, exalting the welfare of the other above his or her own needs.\n\nThe final two styles of love seem to lack aspects of emotion and reciprocity altogether. The ludus style envisions relationships primarily as a game in which it is best to “play the field” or experience a diverse set of partners over time. Mutually-gratifying outcomes in relationships are not considered necessary, and deception of a partner and lack of disclosure about one’s activities are also typical. While Lee found that college students in his study overwhelmingly disagreed with the tenets of this style, substantial numbers of them acted in a typically ludic style while dating, a finding that proves correct the deceit inherent in ludus. Pragma lovers also downplayed emotive aspects of relationships but favoured practical, sensible connections. Successful arranged marriages are a great example of pragma, in that the couple decide to make the relationship work; but anyone who seeks an ideal partner with a shopping list of necessary attributes fits the classification.\n\nRobert J. Sternberg’s contemporary research on love stories has elaborated on how these narratives determine the shape of our relationships and our lives. Sternberg and others have proposed and tested the theory of love as a story, whereby the interaction of our personal attributes with the environment leads to the development of stories about love that we then seek to fulfil, to the extent possible, in our lives. Sternberg’s taxonomy of love stories numbers far more, at twenty-six, than Lee’s taxonomy of love styles, but as Sternberg himself admits there is plenty of overlap. The seventh story, Game, coincides with ludus, for example, while the nineteenth story, Sacrifice, fits neatly on top of agape.\n\nSternberg’s research demonstrates that we may have predilections toward multiple love stories, each represented in a mental hierarchy and varying in weight in terms of their personal significance. This explains the frustration many of us experience when comparing potential partners. One person often fulfils some expected narratives – such as a need for mystery and fantasy – while lacking the ability to meet the demands of others. It is also the case that stories have varying abilities to adapt to a given cultural milieu and its respective demands. Love stories are, therefore, interactive and adaptive phenomena in our lives rather than rigid prescriptions.\n\nSternberg also explores how our love stories interact with the love stories of our partners. What happens when someone who sees love as art collides with someone who sees love as business? Can a Sewing story coexist with a Theatre story? Certainly, it is clear that we look for partners with love stories that complement and are compatible with our own narratives. But they do not have to be an identical match. Not all love stories, however, are equally well predisposed to relationship longevity; stories that view love as a game, as a kind of surveillance or as an addiction are all unlikely to prove durable.\n\nResearch on love stories continues apace. Defying the myth that rigorous science and the romantic persuasions of ordinary people are incompatible, this research demonstrates that good psychology can clarify and comment on the way we give affection and form attachments.",
        "blocks": [
          {
            "type": "endingsMatch",
            "title": "Questions 27–34",
            "instructions": [
              "Match each statement with the correct term, A–F.",
              "Write the correct letter, A–F, in the gaps.",
              "You may use any letter more than once."
            ],
            "endings": {
              "A": "Eros",
              "B": "Mania",
              "C": "Storge",
              "D": "Agape",
              "E": "Ludus",
              "F": "Pragma"
            },
            "items": [
              {
                "q": 27,
                "text": "My most important concern is that my partner is happy."
              },
              {
                "q": 28,
                "text": "I enjoy having many romantic partners."
              },
              {
                "q": 29,
                "text": "I feel that my partner and I were always going to end up together."
              },
              {
                "q": 30,
                "text": "I want to be friends first and then let romance develop later."
              },
              {
                "q": 31,
                "text": "I always feel either very excited or absolutely miserable about my relationship."
              },
              {
                "q": 32,
                "text": "I prefer to keep many aspects of my love life to myself."
              },
              {
                "q": 33,
                "text": "When I am in love, that is all I can think about."
              },
              {
                "q": 34,
                "text": "I know before I meet someone what qualities I need in a partner."
              }
            ]
          },
          {
            "type": "tfng",
            "title": "Questions 35–40",
            "instructions": [
              "Do the following statements agree with the claims of the writer?",
              "Choose YES / NO / NOT GIVEN."
            ],
            "customChoices": [
              "YES",
              "NO",
              "NOT GIVEN"
            ],
            "items": [
              {
                "q": 35,
                "text": "People’s notions of love affect their relationships, rather than vice versa."
              },
              {
                "q": 36,
                "text": "Some of our love stories are more important to us than others."
              },
              {
                "q": 37,
                "text": "Our love stories can change to meet the needs of particular social environments."
              },
              {
                "q": 38,
                "text": "We look for romantic partners with a love story just like our own."
              },
              {
                "q": 39,
                "text": "The most successful partners have matching love stories."
              },
              {
                "q": 40,
                "text": "No love story is more suited to a long relationship than any other."
              }
            ]
          }
        ]
      }
    ]
  }
};

const test3 = {
  "listening": {
    "audioSrc": "https://audio.ieltsmock.org/88_we%20(1).mp3",
    "html": "\n        <div class=\"listen-page\" id=\"listenSec1\">\n          <div class=\"listen-block\">\n            <div class=\"listen-h\">SECTION 1 — Questions 1–10</div>\n\n            <div class=\"listen-card\">\n              <div class=\"listen-card-title\">Questions 1–10</div>\n              <div class=\"listen-inst\">Complete the notes below. Write <b>NO MORE THAN TWO WORDS AND/OR A NUMBER</b> for each answer.</div>\n              <div class=\"listen-card-title\">Hilary Lodge Retirement Home</div>\n              <div class=\"listen-example\">\n                <div><b>Example</b></div>\n                <div>The name of the <b>manager</b> is Cathy.</div>\n              </div>\n              <div class=\"listen-notes\">\n                <div class=\"note-row\"><b>Activities programme involving volunteers</b></div>\n                <div class=\"note-row\">Monday evenings: computer training</div>\n                <div class=\"note-row bullet\">• Training needed in how to produce <span class=\"qnum\">1</span> <input data-lq=\"1\" class=\"l-input\"></div>\n                <div class=\"note-row\">Tuesday afternoons: singing</div>\n                <div class=\"note-row bullet\">• The home has a <span class=\"qnum\">2</span> <input data-lq=\"2\" class=\"l-input\"> and someone to play it</div>\n                <div class=\"note-row\">Thursday mornings: growing <span class=\"qnum\">3</span> <input data-lq=\"3\" class=\"l-input\"></div>\n                <div class=\"note-row bullet\">• The home doesn’t have many <span class=\"qnum\">4</span> <input data-lq=\"4\" class=\"l-input\"> for gardening</div>\n                <div class=\"note-row\">Once a month: meeting for volunteers and staff</div>\n                <div class=\"note-row\"><b>Interview</b></div>\n                <div class=\"note-row bullet\">• Go in on <span class=\"qnum\">5</span> <input data-lq=\"5\" class=\"l-input\">, any time</div>\n                <div class=\"note-row bullet\">• Interview with assistant called <span class=\"qnum\">6</span> <input data-lq=\"6\" class=\"l-input\"></div>\n                <div class=\"note-row bullet\">• Address of home: 73 <span class=\"qnum\">7</span> <input data-lq=\"7\" class=\"l-input\"> Road</div>\n                <div class=\"note-row\"><b>'Open house' days</b></div>\n                <div class=\"note-row bullet\">• Agreed to help on <span class=\"qnum\">8</span> <input data-lq=\"8\" class=\"l-input\"></div>\n                <div class=\"note-row bullet\">• Will show visitors where to <span class=\"qnum\">9</span> <input data-lq=\"9\" class=\"l-input\"></div>\n                <div class=\"note-row bullet\">• Possibility of talking to a <span class=\"qnum\">10</span> <input data-lq=\"10\" class=\"l-input\"> reporter</div>\n              </div>\n            </div>\n          </div>\n        </div>\n\n        <div class=\"listen-page hidden\" id=\"listenSec2\">\n          <div class=\"listen-block\">\n            <div class=\"listen-h\">SECTION 2 — Questions 11–20</div>\n\n            <div class=\"listen-card\">\n              <div class=\"listen-card-title\">Questions 11–15</div>\n            <div class=\"listen-inst\">Label the plan below. Write the correct letter, <b>A–H</b>, next to Questions 11–15.</div>\n<div class=\"img-wrap\" style=\"background:#fff;border:1px solid #d7dce5;border-radius:14px;padding:12px;margin-bottom:14px;\">\n  <img src=\"https://audio.ieltsmock.org/Screenshot%202026-03-13%20at%2021.50.32.png\" alt=\"Plan of Learning Resource Centre (Ground Floor)\" style=\"width:100%;height:auto;display:block;border-radius:10px;\">\n</div>\n              <div class=\"note-row\"><span class=\"qnum\">11</span> Newspapers <input data-lq=\"11\" class=\"l-input tiny\"></div>\n              <div class=\"note-row\"><span class=\"qnum\">12</span> Computers <input data-lq=\"12\" class=\"l-input tiny\"></div>\n              <div class=\"note-row\"><span class=\"qnum\">13</span> Photocopier <input data-lq=\"13\" class=\"l-input tiny\"></div>\n              <div class=\"note-row\"><span class=\"qnum\">14</span> Café <input data-lq=\"14\" class=\"l-input tiny\"></div>\n              <div class=\"note-row\"><span class=\"qnum\">15</span> Sports books <input data-lq=\"15\" class=\"l-input tiny\"></div>\n            </div>\n\n            <div class=\"listen-card\">\n              <div class=\"listen-card-title\">Questions 16–20</div>\n              <div class=\"listen-inst\">Complete the table below. Write <b>ONE WORD ONLY</b> for each answer.</div>\n              <div class=\"listen-table-wrap\">\n                <table class=\"listen-table\">\n                  <thead><tr><th>Name</th><th>New responsibility</th></tr></thead>\n                  <tbody>\n                    <tr><td>Jenny Reed</td><td>Buying <span class=\"qnum\">16</span> <input data-lq=\"16\" class=\"l-input tiny\"> for the Centre</td></tr>\n                    <tr><td>Phil Penshurst</td><td>Help with writing <span class=\"qnum\">17</span> <input data-lq=\"17\" class=\"l-input tiny\"> for courses</td></tr>\n                    <tr><td>Tom Salisbury</td><td>Information on topics related to the <span class=\"qnum\">18</span> <input data-lq=\"18\" class=\"l-input tiny\"></td></tr>\n                    <tr><td>Saeed Aktar</td><td>Finding a <span class=\"qnum\">19</span> <input data-lq=\"19\" class=\"l-input tiny\"></td></tr>\n                    <tr><td>Shilpa Desai</td><td>Help with <span class=\"qnum\">20</span> <input data-lq=\"20\" class=\"l-input tiny\"></td></tr>\n                  </tbody>\n                </table>\n              </div>\n            </div>\n          </div>\n        </div>\n\n        <div class=\"listen-page hidden\" id=\"listenSec3\">\n          <div class=\"listen-block\">\n            <div class=\"listen-h\">SECTION 3 — Questions 21–30</div>\n\n            <div class=\"listen-card\">\n              <div class=\"listen-card-title\">Questions 21–27</div>\n              <div class=\"listen-inst\">What helped Stewart with each of the following stages in making his training film for museum employees? Choose <b>SEVEN</b> answers from the box and write the correct letter, <b>A–I</b>, next to Questions 21–27.</div>\n              <div class=\"endings-box\">\n                <div><b>A</b> advice from friends</div>\n                <div><b>B</b> information on a website</div>\n                <div><b>C</b> being allowed extra time</div>\n                <div><b>D</b> meeting a professional film maker</div>\n                <div><b>E</b> good weather conditions</div>\n                <div><b>F</b> getting a better computer</div>\n                <div><b>G</b> support of a manager</div>\n                <div><b>H</b> help from a family member</div>\n                <div><b>I</b> work on a previous assignment</div>\n              </div>\n              <div class=\"note-row\"><span class=\"qnum\">21</span> finding a location <input data-lq=\"21\" class=\"l-input tiny\"></div>\n              <div class=\"note-row\"><span class=\"qnum\">22</span> deciding on equipment <input data-lq=\"22\" class=\"l-input tiny\"></div>\n              <div class=\"note-row\"><span class=\"qnum\">23</span> writing the script <input data-lq=\"23\" class=\"l-input tiny\"></div>\n              <div class=\"note-row\"><span class=\"qnum\">24</span> casting <input data-lq=\"24\" class=\"l-input tiny\"></div>\n              <div class=\"note-row\"><span class=\"qnum\">25</span> filming <input data-lq=\"25\" class=\"l-input tiny\"></div>\n              <div class=\"note-row\"><span class=\"qnum\">26</span> editing <input data-lq=\"26\" class=\"l-input tiny\"></div>\n              <div class=\"note-row\"><span class=\"qnum\">27</span> designing the DVD cover <input data-lq=\"27\" class=\"l-input tiny\"></div>\n            </div>\n\n            <div class=\"listen-card\">\n              <div class=\"listen-card-title\">Questions 28–30</div>\n              <div class=\"listen-inst\">Complete the notes below. Write <b>ONE WORD ONLY</b> for each answer.</div>\n              <div class=\"listen-card-title\">Stewart’s work placement: benefits to the Central Museum Association</div>\n              <div class=\"listen-notes\">\n                <div class=\"note-row bullet\">• his understanding of the Association’s <span class=\"qnum\">28</span> <input data-lq=\"28\" class=\"l-input\"></div>\n                <div class=\"note-row bullet\">• the reduction in expense</div>\n                <div class=\"note-row bullet\">• increased co-operation between <span class=\"qnum\">29</span> <input data-lq=\"29\" class=\"l-input\"></div>\n                <div class=\"note-row bullet\">• continuous <span class=\"qnum\">30</span> <input data-lq=\"30\" class=\"l-input\"> which led to a better product</div>\n                <div class=\"note-row bullet\">• ideas for distribution of the film</div>\n              </div>\n            </div>\n          </div>\n        </div>\n\n        <div class=\"listen-page hidden\" id=\"listenSec4\">\n          <div class=\"listen-block\">\n            <div class=\"listen-h\">SECTION 4 — Questions 31–40</div>\n\n            <div class=\"listen-card\">\n              <div class=\"listen-card-title\">Questions 31–40</div>\n              <div class=\"listen-inst\">Complete the notes below. Write <b>ONE WORD ONLY</b> for each answer.</div>\n              <div class=\"listen-card-title\">New Caledonian crows and the use of tools</div>\n              <div class=\"listen-notes\">\n                <div class=\"note-row\"><b>Examples of animals using tools</b></div>\n                <div class=\"note-row bullet\">• some chimpanzees use stones to break nuts</div>\n                <div class=\"note-row bullet\">• Betty (New Caledonian crow) made a <span class=\"qnum\">31</span> <input data-lq=\"31\" class=\"l-input\"> out of wire to move a bucket of food</div>\n                <div class=\"note-row bullet\">• Barney (New Caledonian crow) used sticks to find food</div>\n                <div class=\"note-row\"><b>New Zealand and Oxford experiment</b></div>\n                <div class=\"note-row bullet\">• three stages: crows needed to move a <span class=\"qnum\">32</span> <input data-lq=\"32\" class=\"l-input\"> in order to reach a short stick; then use the short stick to reach a long stick; then use the long stick to reach food</div>\n                <div class=\"note-row\"><b>Oxford research</b></div>\n                <div class=\"note-row bullet\">• crows used sticks to investigate whether there was any <span class=\"qnum\">33</span> <input data-lq=\"33\" class=\"l-input\"> from an object</div>\n                <div class=\"note-row bullet\">• research was inspired by seeing crows using tools on a piece of cloth to investigate a spider design</div>\n                <div class=\"note-row bullet\">• Barney used a stick to investigate a snake made of <span class=\"qnum\">34</span> <input data-lq=\"34\" class=\"l-input\"></div>\n                <div class=\"note-row bullet\">• Pierre used a stick to investigate a <span class=\"qnum\">35</span> <input data-lq=\"35\" class=\"l-input\"></div>\n                <div class=\"note-row bullet\">• Corbeau used a stick to investigate a metal toad</div>\n                <div class=\"note-row bullet\">• the crows only used sticks for the first contact</div>\n                <div class=\"note-row\"><b>Conclusions of above research</b></div>\n                <div class=\"note-row bullet\">• ability to plan provides interesting evidence of the birds’ cognition</div>\n                <div class=\"note-row bullet\">• unclear whether this is evidence of the birds’ <span class=\"qnum\">36</span> <input data-lq=\"36\" class=\"l-input\"></div>\n                <div class=\"note-row\"><b>Exeter and Oxford research in New Caledonia</b></div>\n                <div class=\"note-row bullet\">• scientists have attached very small cameras to birds’ <span class=\"qnum\">37</span> <input data-lq=\"37\" class=\"l-input\"></div>\n                <div class=\"note-row bullet\">• food in the form of beetle larvae provides plenty of <span class=\"qnum\">38</span> <input data-lq=\"38\" class=\"l-input\"> for the birds</div>\n                <div class=\"note-row bullet\">• larvae’s specific <span class=\"qnum\">39</span> <input data-lq=\"39\" class=\"l-input\"> composition can be identified in birds that feed on them</div>\n                <div class=\"note-row bullet\">• scientists will analyse what the birds include in their <span class=\"qnum\">40</span> <input data-lq=\"40\" class=\"l-input\"></div>\n              </div>\n            </div>\n          </div>\n        </div>\n\n        <div class=\"listen-footer\">\n          <div class=\"muted\" id=\"listenAutosave\">Autosave: ready</div>\n          <button class=\"btn secondary\" id=\"downloadListeningBtn\" type=\"button\">Download Listening answers (JSON)</button>\n          <button class=\"btn secondary\" id=\"copyListeningBtn\" type=\"button\">Copy Listening answers</button>\n          <button class=\"btn\" id=\"submitListeningBtn\" type=\"button\">Submit Listening now</button>\n        </div>\n      "
  },
  "writing": {
    "task1Type": "Pie chart",
    "task2Type": "Positive or negative development",
    "task1Html": "You should spend about 20 minutes on this task.<br>\nThe pie charts give information about the world's forest in five different regions.<br>\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.<br>\n<b>Write at least 150 words.</b>",
    "task1ImageSrc": "https://ieltscity.vn/wp-content/uploads/2024/08/de-thi-ielts-writing-task-1-ngay-07-10-2024-updated.jpg",
    "task2Html": "You should spend about 40 minutes on this task.<br><br>\nToday more people put their private information (address, telephone and plastic card numbers) online to do their daily activities (banking, shopping, socializing).<br>\n<b>Is it a positive or negative development?</b><br>\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.<br>\n<b>Write at least 250 words.</b>",
    "sampleAnswers": {
      "task1": {
        "bandScore": "Band 6.5",
        "explanation": "This report gives an overall picture and makes comparisons, but it stays slightly general because the visual details are summarised more broadly than in a stronger Band 7+ answer. The structure is clear and the language is mostly accurate.",
        "sampleAnswer": "The pie charts compare the distribution of the world's forests across five regions.\n\nOverall, the world's forest resources were not shared equally. Two regions accounted for the largest proportions, whereas the remaining areas made up noticeably smaller shares of the total.\n\nEurope represented the biggest segment of global forest area, while South America also occupied a substantial proportion. North America formed another important share, although it was smaller than the first two regions. By contrast, Asia and Africa contributed much smaller percentages overall, with Africa appearing to have the smallest share among the five regions.\n\nThe charts therefore suggest that the majority of the world's forests were concentrated in a limited number of regions rather than being spread evenly across the globe. The gap between the largest and smallest categories is clearly significant.\n\nIn summary, Europe and South America dominated the global distribution of forests, North America occupied a moderate proportion, and the smallest shares belonged to Asia and Africa.",
        "correctedForm": "The pie charts illustrate how the world's forests are distributed among five regions.\n\nOverall, forest resources are unevenly spread, with the largest proportions concentrated in Europe and South America, while Asia and Africa account for noticeably smaller shares.\n\nEurope makes up the biggest segment of the total, and South America is also responsible for a considerable proportion. North America contributes a moderate share in comparison with these two regions. By contrast, Asia represents a smaller part of the global total, and Africa has the smallest proportion among the five regions shown.\n\nTaken together, the charts indicate that a large percentage of the world's forests is concentrated in just a few areas, whereas the remaining regions hold much less.\n\nIn short, Europe and South America dominate the global picture, North America occupies a middle position, and Asia and Africa account for the smallest proportions."
      },
      "task2": {
        "bandScore": "Band 7.5",
        "explanation": "This response presents a clear position, weighs benefits against risks, and keeps the argument focused. It reaches Band 7.5 because the ideas are well organized and supported, although a few points could be expanded further for an even stronger high-band essay.",
        "sampleAnswer": "More people now share private information online in order to shop, bank and communicate more conveniently. In my view, this is both a useful and an unavoidable development, but overall it is negative because the risks to privacy and security are too serious.\n\nOn the positive side, putting information online has made daily life faster and more efficient. People can transfer money, buy goods and keep in contact with others without visiting banks or shops in person. This saves time and often reduces cost. For many users, online systems are also more convenient because services are available at any hour.\n\nHowever, the disadvantages are more significant. Once personal data is stored online, it can be stolen, misused or sold without the user's knowledge. Cybercrime, identity theft and online fraud have become common problems, and even large companies are not always able to protect customer information completely. A single data leak can expose addresses, telephone numbers and bank details to criminals.\n\nAnother concern is that many people do not fully understand how much information they are giving away. Some users accept terms and conditions without reading them, while others share personal details too freely on social media. This creates long-term privacy risks that are difficult to reverse.\n\nIn conclusion, although online services make modern life easier, I believe that putting private information online is a negative development overall. The convenience is real, but the potential harm to privacy and personal security is greater.",
        "correctedForm": "Today, many people provide personal information online in order to carry out everyday activities such as banking, shopping and socialising. Although this trend offers clear convenience, I believe it is a negative development overall because it exposes individuals to serious privacy and security risks.\n\nThere are obvious benefits to storing and using information online. Digital services save time, allow instant transactions and make communication easier. People can shop from home, pay bills quickly and stay connected across long distances. In that sense, online access has made daily life far more efficient.\n\nNevertheless, the main drawback is the danger of misuse. Personal data can be hacked, leaked or exploited by companies and criminals. Identity theft, financial fraud and privacy breaches have become increasingly common, and even well-known organisations are vulnerable to cyberattacks.\n\nIn addition, many users are unaware of how widely their information may be shared. They may agree to weak privacy settings or disclose too much on social platforms without considering the long-term consequences.\n\nIn conclusion, while putting private information online is convenient and often practical, it is ultimately a negative development because the threats to privacy and security outweigh the benefits."
      }
    }
  },
  "reading": {
    "parts": [
      {
        "id": "part1",
        "passageText": "The Phoenicians: an almost forgotten people\n\nThe Phoenicians inhabited the region of modern Lebanon and Syria from about 3000 BC. They became the greatest traders of the pre-classical world, and were the first people to establish a large colonial network. Both of these activities were based on seafaring, an ability the Phoenicians developed from the example of their maritime predecessors, the Minoans of Crete.\n\nAn Egyptian narrative of about 1080 BC, the Story of Wen-Amon, provides an insight into the sea-faring trading activity. One of the characters is Werek-Ba, a Phoenician merchant living at Tanis in Egypt. Little more than 50 ships carry out his business, plying back and forth between the Nile and the Phoenician port of Sidon.\n\nThe most prosperous period for Phoenicia was the 10th century BC, when the surrounding region was stable. Hiram, the king of the Phoenician city of Tyre, was an ally and business partner of Solomon, king of Israel. For Solomon's temple in Jerusalem, Hiram provided craftsmen with particular skills that were needed for this major construction project. He also supplied materials - particularly timber, including cedar from the forests of Lebanon. And the two kings went into trade in partnership. They sent out Phoenician vessels on long expeditions (of up to three years for return trips) to bring back gold, sandalwood, ivory, monkeys and peacocks from Ophir. This is an unidentified place, probably on the east coast of Africa or the west coast of India.\n\nPhoenicia was famous for its luxury goods. The cedar wood was not only exported as top-quality timber for architecture and shipbuilding. It was also carved by the Phoenicians, and the same skill was adapted to even more precious work in ivory. The rare and expensive dye for cloth, Tyrian purple, complemented another famous local product, fine linen. The metalworkers of the region, particularly those working in gold, were famous. Tyre and Sidon were also known for their glass.\n\nThese were the main products which the Phoenicians exported. In addition, as traders and middlemen, they took a commission on much larger trade of precious goods that they transported from elsewhere.\n\nThe extensive trade of Phoenicia required much shipbuilding and correspondingly, a need for the field of writing that the Phoenicians made their most lasting contribution to world history. The scripts in use in the world up to the second millennium BC in Egypt, Mesopotamia or China all required the writer to learn a large number of separate characters - each of them expressing either a whole word or an element of its meaning. By contrast, the Phoenicians, in about 1500 BC, developed an entirely new approach to writing. The marks made (with a pointed tool called a stylus, on damp clay) now intended to capture the sound of a word. This required an alphabet of individual letters.\n\nThe trading and seafaring skills of the Phoenicians resulted in a network of colonies, spreading westwards through the Mediterranean. The first was probably Citium, in Cyprus, established in the 9th century BC. But the main expansion came from the 8th century BC onwards, when pressure from Assyria to the east disrupted the patterns of trade on which the Phoenician coast depended.\n\nTrading colonies were developed on the fringe islands in the centre of the Mediterranean - Crete, Sicily, Malta, Sardinia, Ibiza - and also on the coast of north Africa. The African colonies clustered in particular around the great promontory which, with Sicily opposite, forms the narrowest channel in the Mediterranean sea route. This is the site of Carthage, the largest of the towns founded by the Phoenicians on the north African coast, and it rapidly assumed a leading position among the newly founded colonies. The traditional date of its founding is 814 BC, but archaeological evidence suggests that it was probably settled a little over a century later.\n\nThe subsequent spread and growth of Phoenician colonies in the western Mediterranean, and even out to the Atlantic coasts of Africa and Spain, was as much the achievement of Carthage as of original Phoenician trading cities such as Tyre and Sidon. But local interests remained with the homeland, and new colonies continued to travel west.\n\nFrom the 8th century BC, many of the coastal cities of Phoenicia came under the control of repeated and imperial powers, each of them defeated and replaced in the region by the next: first the Assyrians, then the Babylonians, Persians and the Hellenistic Greek.\n\nIn 64 BC, the area of Phoenicia became part of the Roman province of Syria. The Phoenicians as an identifiable people then faded from history, merging into the populations of modern Lebanon and northern Syria.",
        "blocks": [
          {
            "type": "sentenceGaps",
            "title": "Questions 1–8",
            "instructions": [
              "Complete the sentences below.",
              "Choose ONE WORD ONLY from the passage for each answer.",
              "Write your answers in the gaps."
            ],
            "items": [
              {
                "q": 1,
                "text": "The Phoenicians' skill at",
                "tail": "helped them to trade."
              },
              {
                "q": 2,
                "text": "In an ancient story, a",
                "tail": "from Phoenicia, who lived in Egypt, owned over 50 ships."
              },
              {
                "q": 3,
                "text": "A king of Israel built a",
                "tail": "using supplies from Phoenicia."
              },
              {
                "q": 4,
                "text": "Phoenicia supplied Solomon with skilled",
                "tail": "."
              },
              {
                "q": 5,
                "text": "The main material that Phoenicia sent to Israel was",
                "tail": "."
              },
              {
                "q": 6,
                "text": "The kings of Phoenicia and Israel formed a business",
                "tail": "in order to carry out trade."
              },
              {
                "q": 7,
                "text": "Phoenicians carved",
                "tail": "as well as cedar."
              },
              {
                "q": 8,
                "text": "The Phoenicians also earned a",
                "tail": "for shipping goods."
              }
            ]
          },
          {
            "type": "tfng",
            "title": "Questions 9–13",
            "instructions": [
              "Do the following statements agree with the information given in Reading Passage 1?",
              "In boxes 9–13 on your answer sheet, write TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, or NOT GIVEN if there is no information on this."
            ],
            "items": [
              {
                "q": 9,
                "text": "Problems with Assyria led to the establishment of a number of Phoenician colonies."
              },
              {
                "q": 10,
                "text": "Carthage was an enemy town which the Phoenicians won in battle."
              },
              {
                "q": 11,
                "text": "Phoenicians reached the Atlantic ocean."
              },
              {
                "q": 12,
                "text": "Parts of Phoenicia were conquered by a series of empires."
              },
              {
                "q": 13,
                "text": "The Phoenicians welcomed Roman control of the area."
              }
            ]
          }
        ]
      },
      {
        "id": "part2",
        "passageText": "The Hollywood Film Industry\n\nA This chapter examines the 'Golden Age' of the Hollywood film studio system and explores how a particular kind of filmmaking developed during this period in US film history. It also focuses on two key elements which influenced the emergence of the classic Hollywood studio system: the advent of sound and the business ideal of vertical integration. In addition to its historical interest, inspecting the growth of the studio system may offer clues regarding the factors of structural change within the growth of new media. It might, in fact, be intriguing to examine which changes occurred during the growth of the Hollywood studio, and compare those changes to contemporary struggles in which production companies are trying to define and control emerging industries, such as online film and interactive television.\n\nB The shift of the industry away from 'silent' films began during the late 1920s. Warner Bros.' 1927 film The Jazz Singer was the first to feature synchronized speech and, with it, came a period of turmoil for the industry. Studios now had proof that talked films would make them money, but the financial investment this kind of filmmaking would require, from new camera equipment to new projection facilities, made the studios hesitant to invest at first. In the power of one nation seemed to be more audiences and enhance the story pervaded studios that talks were worth investing in. Overall, the use of sound in film was well-received by audiences, but there were still many technical factors to consider. Although full integration of sound into movies was complete by 1930, it would take somewhat longer for them to regain their stylistic elegance and dexterity. The camera now had to be encased in a big, clumsy, unmovable soundproof box. In addition, actors struggled, having to direct their speech to awkwardly-hidden microphones in huge plants, telephones or even costumes.\n\nC Vertical integration is the other key component in the rise of the Hollywood studio system. The major studios realized they could increase their profits by handling each stage of a film's life: production (making the film), distribution (getting the film out to people) and exhibition (owning the theaters in major cities where films were shown first). Five studios, The Big Five, worked to achieve vertical integration through the mid 1940s, owning first and second run which to construct elaborate sets. In addition, these studios set the exact terms of films' release dates and patterns. Warner Bros., Paramount, 20th Century Fox, MGM and RKO formed this exclusive club. The Little Three - Universal, Columbia and United Artists - also maintained their own kind of vertical integration. Together these eight companies operated as a mature oligopoly, essentially running the entire market.\n\nD During the Golden Age, the studios were remarkably consistent and stable enterprises, due in large part to long-term management heads - the infamous 'movie moguls' who ruled their kingdoms with iron fists. At MGM, Warner Bros. and Columbia, the same men ran their studios for decades. The rise of the studio system also hinges on the treatment of stars, who were constructed and exploited to suit a studio's image and schedule. Actors were bound up in seven-year contracts to a single studio, and the studio bosses generally held all the options. Stars could be loaned out to other production companies at any time. Studio bosses could also force bad roles on actors. and manipulate every single detail of stars' images with their mammoth in-house publicity departments. Some have compared the Hollywood studio system to a factory, and it is useful to remember that studios were out to make money first and art second.\n\nE On the other hand, studios also had to cultivate flexibility, in addition to consistent factory output. Studio heads realized that they couldn't make virtually the same film over and over again with the same cast of stars and still expect to keep turning a profit. They also had to create product differentiation. Examining how production companies tried to differentiate products can lend itself to broader conceptualisations of individual studios' styles. MGM tended to put out a lot of all-star productions while Paramount excelled in comedy and Warner Bros. developed a reputation for gritty social realism. 20th Century Fox forged the musical and a great deal of prestige biographies, while Universal specialized in classic horror movies.\n\nF In 1948, struggling independent movie producers and exhibitors finally triumphed in their battle against the big studios' monopolistic behavior. In the United States versus Paramount federal decree of that year, the studios were ordered to give up their theaters in what is commonly referred to as divestiture - opening the market to smaller producers. This, coupled with the advent of television in the 1950s, seriously compromised the studio system's influence and profits. Hence, 1930 and 1948 are generally considered bookends to Hollywood's Golden Age.",
        "blocks": [
          {
            "type": "headings",
            "title": "Questions 14–19",
            "instructions": [
              "Reading Passage 2 has six paragraphs, A–F.",
              "Choose the correct heading for each paragraph from the list of headings below.",
              "Write the correct number, i–viii, in boxes 14–19 on your answer sheet."
            ],
            "listTitle": "List of Headings",
            "headings": [
              {
                "value": "i",
                "label": "The power within each studio"
              },
              {
                "value": "ii",
                "label": "The movie industry adapts to innovation"
              },
              {
                "value": "iii",
                "label": "Contrasts between cinema and other media of the time"
              },
              {
                "value": "iv",
                "label": "The value of studying Hollywood's Golden Age"
              },
              {
                "value": "v",
                "label": "Distinguishing themselves from the rest of the market"
              },
              {
                "value": "vi",
                "label": "A double attack on film studios' power"
              },
              {
                "value": "vii",
                "label": "Gaining control of the industry"
              },
              {
                "value": "viii",
                "label": "The top movies of Hollywood's Golden Age"
              }
            ],
            "questions": [
              {
                "q": 14,
                "paragraph": "Paragraph A"
              },
              {
                "q": 15,
                "paragraph": "Paragraph B"
              },
              {
                "q": 16,
                "paragraph": "Paragraph C"
              },
              {
                "q": 17,
                "paragraph": "Paragraph D"
              },
              {
                "q": 18,
                "paragraph": "Paragraph E"
              },
              {
                "q": 19,
                "paragraph": "Paragraph F"
              }
            ]
          },
          {
            "type": "tfng",
            "title": "Questions 20–23",
            "instructions": [
              "Do the following statements agree with the information in Reading Passage 2?",
              "In boxes 20–23 on your answer sheet, write TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, or NOT GIVEN if there is no information on this."
            ],
            "items": [
              {
                "q": 20,
                "text": "After The Jazz Singer came out, other studios immediately began making movies with synchronized sound."
              },
              {
                "q": 21,
                "text": "There were some drawbacks to recording movie actors' voices in the early 1930s."
              },
              {
                "q": 22,
                "text": "There was intense competition between actors for contracts with the leading studios."
              },
              {
                "q": 23,
                "text": "Studios had total control over how their actors were perceived by the public."
              }
            ]
          },
          {
            "type": "sentenceGaps",
            "title": "Questions 24–26",
            "instructions": [
              "Complete the summary below.",
              "Choose NO MORE THAN TWO WORDS from the passage for each answer.",
              "Write your answers in boxes 24–26 on your answer sheet."
            ],
            "items": [
              {
                "q": 24,
                "text": "Throughout its Golden Age, the Hollywood movie industry was controlled by a handful of studios. Using a system known as",
                "tail": ", the biggest studios not only made movies, but handled their distribution and then finally showed them in their own theaters."
              },
              {
                "q": 25,
                "text": "These studios were often run by autocratic bosses – men known as",
                "tail": " who often remained at the head of organisations for decades."
              },
              {
                "q": 26,
                "text": "However, the domination of the industry by the leading studios came to an end in 1948, when they were forced to open the market to smaller producers – a process known as",
                "tail": "."
              }
            ]
          }
        ]
      },
      {
        "id": "part3",
        "passageText": "Left or right?\n\nAn overview of some research into lateralisation: the dominance of one side of the body over the other\n\nA Creatures across the animal kingdom have a preference for one foot, eye or even antenna. The cause of this trait, called lateralisation, is fairly simple: one side of the brain, which generally controls the opposite side of the body, is more dominant than the other when processing certain tasks. This does, on some occasions, let the animal down: such as when a food tile is snapped up by the stronger eye from the right, but because its right eye is worse at spotting danger than its left. So why would animals evolve a characteristic that seems to endanger them?\n\nB For many years it was assumed that lateralisation was a uniquely human trait, but this notion rapidly fell apart as researchers started uncovering evidence of lateralisation in all sorts of animals. For example, in the 1970s, Lesley Rogers, now at the University of New England in Australia, was studying memory and learning in chicks. She had been injecting a chemical into chicks' brains to stop them learning how to spot grains of food among distracting pebbles, and was surprised to observe that the chemical only worked when applied to the left hemisphere of the brain. That strongly suggested that the right side of the brain played little or no role in the learning of such behaviours. Similar evidence appeared in songbirds and rats around the same time, and since then, researchers have built up an impressive catalogue of animal lateralisation.\n\nC In some animals, lateralisation is simply a preference for a single paw or foot, while others it appears in more general patterns of behaviour. The left side of most vertebrate brains, for example, seems to process and control feeding. Since the left hemisphere processes input from the right side of the body, that means animals with their left heads and birds are more likely to tuck prey or food items viewed via their right side. Even humpback whales prefer to use the right side of their jaws to scrape and sift from the ocean floor.\n\nD Genetics plays a part in determining lateralisation, but environmental factors have an impact too. Rogers found that a chick's lateralisation depends on whether it is exposed to light before hatching from its egg - if it is kept in the dark during this period, neither hemisphere becomes dominant. In 2004, Rogers tested this observation, letting chicks with either strong or weak lateralisation feed while distracting them with some identical red beads. When she then presented the two groups with overheads and omitted some pebbles and the threatening shape of a fox predator flying overhead. As predicted, the birds incubated in the light looked for food mainly with their right eye, while using the other to check out the predator. The weakly-lateralised chicks, meanwhile, had difficulty performing these two activities simultaneously.\n\nE Similar results probably hold true for many other animals. In 2006, Angelo Bisazza at the University of Padua set out to observe the differences in feeding behavior between strongly-lateralised and weakly-lateralised fish. He found that strongly-lateralised individuals were able to feed twice as fast as weakly-lateralised ones when there was a threat of a predator looming above them. Assigning different jobs to different brain halves may be especially advantageous for animals such as birds or fish, whose eyes are placed on the sides of their heads. This enables them to process input from each eye separately, with different tasks in mind.\n\nF And what of those animals who favour a specific side for almost all tasks? In 2009, Maria Magat and Culum Brown at Macquarie University in Australia wanted to see if there was general cognitive advantage in lateralisation. To investigate, they turned to parrots, which can be either strongly right- or left-footed, or ambidextrous (without dominant limb). The parrots were given the intellectually demanding task of pulling a snack on a string up to their beaks, using a coordinated combination of claws and beak. The result showed that the parrots with the strongest foot preferences worked out the puzzle more quickly than their ambidextrous peers.\n\nG A further puzzle is why are there always a few exceptions, like left-handed humans, who are wired differently from the majority of the population? Giorgio Vallortigara, and Stefano Ghirlanda of Stockholm University seem to have solved the issue via mathematical models. These back up the idea that in life is better to answer an attack with the fewest casualties if the majority turn together in one direction while a very small proportion of the group escape in the direction that the predator is not expecting.\n\nH This imbalance of lateralisation within populations may also have advantages for individuals. Whereas most co-operative interactions require participants to react similarly, there are some situations - such as aggressive interactions - where it can benefit an individual to launch an attack from an unexpected quarter. Perhaps this can partly explain the existence of left-handers in human society. It has been suggested that when it comes to hand-to-hand fighting, left-handers may have the advantage over the right-handed majority. Where survival depends on the element of surprise, it may indeed pay to be different.",
        "blocks": [
          {
            "type": "endingsMatch",
            "title": "Questions 27–30",
            "instructions": [
              "Complete each sentence with the correct ending, A–F, below.",
              "Write the correct letter, A–F, in boxes 27–30 on your answer sheet."
            ],
            "endings": {
              "A": "lateralisation is more common in some species than in others.",
              "B": "it benefits a population if some members have a different lateralisation than the majority.",
              "C": "lateralisation helps animals to do two things at the same time.",
              "D": "lateralisation is not confined to human beings.",
              "E": "the greater an animal's lateralisation, the better it is at problem-solving.",
              "F": "strong lateralisation may sometimes put groups of animals in danger."
            },
            "items": [
              {
                "q": 27,
                "text": "In the 1970s, Lesley Rogers discovered that"
              },
              {
                "q": 28,
                "text": "Angelo Bisazza's experiments revealed that"
              },
              {
                "q": 29,
                "text": "Magat and Brown's studies show that"
              },
              {
                "q": 30,
                "text": "Vallortigara and Ghirlanda's research findings suggest that"
              }
            ]
          },
          {
            "type": "sentenceGaps",
            "title": "Questions 31–35",
            "instructions": [
              "Complete the summary below.",
              "Choose ONE WORD ONLY from the passage for each answer.",
              "Write your answers in boxes 31–35 on your answer sheet."
            ],
            "items": [
              {
                "q": 31,
                "text": "Lateralisation is determined by both genetic and",
                "tail": " influences."
              },
              {
                "q": 32,
                "text": "Rogers found that chicks whose eggs are given",
                "tail": " during the incubation period tend to have a stronger lateralisation."
              },
              {
                "q": 33,
                "text": "Her 2004 experiment set out to prove that these chicks were better at",
                "tail": " than weakly lateralised chicks."
              },
              {
                "q": 34,
                "text": "As expected, the strongly lateralised birds in the experiment were more able to locate",
                "tail": " using their right eye, while using their left eye to monitor an imitation"
              },
              {
                "q": 35,
                "inlineWithPrevious": true,
                "text2": " located above them."
              }
            ]
          },
          {
            "type": "endingsMatch",
            "title": "Questions 36–40",
            "instructions": [
              "Reading Passage 3 has eight paragraphs, A–H.",
              "Which paragraph contains the following information?",
              "Write the correct letter, A–H, in boxes 36–40 on your answer sheet. You may use any letter more than once."
            ],
            "endings": {
              "A": "Paragraph A",
              "B": "Paragraph B",
              "C": "Paragraph C",
              "D": "Paragraph D",
              "E": "Paragraph E",
              "F": "Paragraph F",
              "G": "Paragraph G",
              "H": "Paragraph H"
            },
            "items": [
              {
                "q": 36,
                "text": "description of a study which supports another scientist's findings"
              },
              {
                "q": 37,
                "text": "the suggestion that a person could gain from having an opposite lateralisation to most of the population"
              },
              {
                "q": 38,
                "text": "reference to the large amount of knowledge of animal lateralisation that has accumulated"
              },
              {
                "q": 39,
                "text": "research findings that were among the first to contradict a previous belief"
              },
              {
                "q": 40,
                "text": "a suggestion that lateralisation would seem to disadvantage animals"
              }
            ]
          }
        ]
      }
    ]
  }
};

const test4 = {
  "listening": {
    "audioSrc": "https://audio.ieltsmock.org/87_we.mp3",
    "html": "\n        <div class=\"listen-page\" id=\"listenSec1\">\n          <div class=\"listen-block\">\n            <div class=\"listen-h\">SECTION 1 — Questions 1–10</div>\n\n            <div class=\"listen-card\">\n              <div class=\"listen-card-title\">Questions 1–6</div>\n              <div class=\"listen-inst\">Complete the table below. Write <b>NO MORE THAN ONE WORD OR A NUMBER</b> for each answer.</div>\n              <div class=\"listen-card-title\">Hostel Accommodation in Darwin</div>\n              <div class=\"listen-table-wrap\">\n                <table class=\"listen-table\">\n                  <thead>\n                    <tr><th>Name</th><th>Price per person</th><th>Comments and reviews</th></tr>\n                  </thead>\n                  <tbody>\n                    <tr>\n                      <td>Top End Backpackers</td>\n                      <td>$19</td>\n                      <td>\n                        parking available<br>\n                        staff are <span class=\"qnum\">1</span> <input data-lq=\"1\" class=\"l-input tiny\"><br>\n                        nice pool<br>\n                        air conditioning is too <span class=\"qnum\">2</span> <input data-lq=\"2\" class=\"l-input tiny\">\n                      </td>\n                    </tr>\n                    <tr>\n                      <td>Gum Tree Lodge</td>\n                      <td><span class=\"qnum\">3</span> <input data-lq=\"3\" class=\"l-input tiny\"></td>\n                      <td>\n                        good quiet location<br>\n                        pool and gardens<br>\n                        <span class=\"qnum\">4</span> <input data-lq=\"4\" class=\"l-input tiny\"> in the dormitories\n                      </td>\n                    </tr>\n                    <tr>\n                      <td>Kangaroo Lodge</td>\n                      <td>$22</td>\n                      <td>\n                        downtown location<br>\n                        reception always open<br>\n                        no lockers in the rooms<br>\n                        the <span class=\"qnum\">5</span> <input data-lq=\"5\" class=\"l-input tiny\"> are very clean<br>\n                        seems to be a <span class=\"qnum\">6</span> <input data-lq=\"6\" class=\"l-input tiny\"> every night\n                      </td>\n                    </tr>\n                  </tbody>\n                </table>\n              </div>\n            </div>\n\n            <div class=\"listen-card\">\n              <div class=\"listen-card-title\">Questions 7–10</div>\n              <div class=\"listen-inst\">Complete the notes below. Write <b>ONE WORD ONLY</b> for each answer.</div>\n              <div class=\"listen-card-title\">Kangaroo Lodge</div>\n              <div class=\"listen-notes\">\n                <div class=\"note-row\">Address: on <span class=\"qnum\">7</span> <input data-lq=\"7\" class=\"l-input\"> Lane</div>\n                <div class=\"note-row\"><b>General information about hostel accommodation</b></div>\n                <div class=\"note-row bullet\">Sheets are provided</div>\n                <div class=\"note-row bullet\">Can hire a <span class=\"qnum\">8</span> <input data-lq=\"8\" class=\"l-input\"></div>\n                <div class=\"note-row bullet\"><span class=\"qnum\">9</span> <input data-lq=\"9\" class=\"l-input\"> is included</div>\n                <div class=\"note-row bullet\">A shared <span class=\"qnum\">10</span> <input data-lq=\"10\" class=\"l-input\"> is available</div>\n              </div>\n            </div>\n          </div>\n        </div>\n\n        <div class=\"listen-page hidden\" id=\"listenSec2\">\n          <div class=\"listen-block\">\n            <div class=\"listen-h\">SECTION 2 — Questions 11–20</div>\n\n            <div class=\"listen-card\">\n              <div class=\"listen-card-title\">Questions 11–16</div>\n              <div class=\"listen-inst\">Choose the correct letter, <b>A, B or C</b>.</div>\n              <div class=\"listen-card-title\">Anglia Sculpture Park</div>\n              <div class=\"mcq\">\n                <div class=\"mcq-q\"><span class=\"qnum\">11</span> The land where the Sculpture Park is located was previously</div>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q11\" value=\"A\" data-lq-radio=\"11\"> A) completely covered by forest</label>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q11\" value=\"B\" data-lq-radio=\"11\"> B) the site of a private house</label>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q11\" value=\"C\" data-lq-radio=\"11\"> C) occupied by a factory</label>\n              </div>\n              <div class=\"mcq\">\n                <div class=\"mcq-q\"><span class=\"qnum\">12</span> What is unusual about the Anglia Sculpture Park?</div>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q12\" value=\"A\" data-lq-radio=\"12\"> A) Artists have made sculptures especially for it</label>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q12\" value=\"B\" data-lq-radio=\"12\"> B) Some of its sculptures were donated by the artists</label>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q12\" value=\"C\" data-lq-radio=\"12\"> C) It only shows contemporary sculptures</label>\n              </div>\n              <div class=\"mcq\">\n                <div class=\"mcq-q\"><span class=\"qnum\">13</span> What is the theme of Joe Tremain’s “burnt” sculptures?</div>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q13\" value=\"A\" data-lq-radio=\"13\"> A) the contrast between nature and urban life</label>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q13\" value=\"B\" data-lq-radio=\"13\"> B) the effect of man on the environment</label>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q13\" value=\"C\" data-lq-radio=\"13\"> C) the violence of nature</label>\n              </div>\n              <div class=\"mcq\">\n                <div class=\"mcq-q\"><span class=\"qnum\">14</span> The path by the Lower Lake</div>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q14\" value=\"A\" data-lq-radio=\"14\"> A) is rather wet in some places</label>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q14\" value=\"B\" data-lq-radio=\"14\"> B) has recently been repaired</label>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q14\" value=\"C\" data-lq-radio=\"14\"> C) is difficult to walk on</label>\n              </div>\n              <div class=\"mcq\">\n                <div class=\"mcq-q\"><span class=\"qnum\">15</span> What does the speaker say about the Visitor Centre?</div>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q15\" value=\"A\" data-lq-radio=\"15\"> A) It is being enlarged at present</label>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q15\" value=\"B\" data-lq-radio=\"15\"> B) It has received an international award</label>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q15\" value=\"C\" data-lq-radio=\"15\"> C) It was designed by a Canadian architect</label>\n              </div>\n              <div class=\"mcq\">\n                <div class=\"mcq-q\"><span class=\"qnum\">16</span> Today, visitors can buy snacks and sandwiches</div>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q16\" value=\"A\" data-lq-radio=\"16\"> A) at the kiosk</label>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q16\" value=\"B\" data-lq-radio=\"16\"> B) in the Terrace Room</label>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q16\" value=\"C\" data-lq-radio=\"16\"> C) at the Lower Lake Cafe</label>\n              </div>\n            </div>\n\n            <div class=\"listen-card\">\n              <div class=\"listen-card-title\">Questions 17–20</div>\n              <div class=\"listen-inst\">Label the map below. Write the correct letter, <b>A–F</b>, next to Questions 17–20.</div>\n              <div class=\"img-wrap\" style=\"background:#fff;border:1px solid #d7dce5;border-radius:14px;padding:12px;margin-bottom:14px;\">\n                <img src=\"https://practicepteonline.com/wp-content/uploads/2024/09/lis-test87.png\" alt=\"Map of Anglia Sculpture Park\" style=\"width:auto;max-width:100%;max-height:420px;height:auto;display:block;margin:0 auto;border-radius:10px;\">\n              </div>\n              <div class=\"note-row\"><span class=\"qnum\">17</span> Joe Tremain sculptures <input data-lq=\"17\" class=\"l-input tiny\"></div>\n              <div class=\"note-row\"><span class=\"qnum\">18</span> Giorgio Catalucci bird sculptures <input data-lq=\"18\" class=\"l-input tiny\"></div>\n              <div class=\"note-row\"><span class=\"qnum\">19</span> Garden gallery <input data-lq=\"19\" class=\"l-input tiny\"></div>\n              <div class=\"note-row\"><span class=\"qnum\">20</span> Long house <input data-lq=\"20\" class=\"l-input tiny\"></div>\n            </div>\n          </div>\n        </div>\n\n        <div class=\"listen-page hidden\" id=\"listenSec3\">\n          <div class=\"listen-block\">\n            <div class=\"listen-h\">SECTION 3 — Questions 21–30</div>\n\n            <div class=\"listen-card\">\n              <div class=\"listen-card-title\">Questions 21–26</div>\n              <div class=\"listen-inst\">Choose the correct letter, <b>A, B or C</b>.</div>\n              <div class=\"listen-card-title\">Marketing report</div>\n              <div class=\"mcq\">\n                <div class=\"mcq-q\"><span class=\"qnum\">21</span> Why did Leo choose instant coffee as the topic for his marketing report?</div>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q21\" value=\"A\" data-lq-radio=\"21\"> A) He found plenty of material on the topic</label>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q21\" value=\"B\" data-lq-radio=\"21\"> B) He had some practical experience in the area</label>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q21\" value=\"C\" data-lq-radio=\"21\"> C) He had an idea of a brand he wanted to target</label>\n              </div>\n              <div class=\"mcq\">\n                <div class=\"mcq-q\"><span class=\"qnum\">22</span> Leo discovered that in Australia, recent technological developments</div>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q22\" value=\"A\" data-lq-radio=\"22\"> A) are producing less healthy types of instant coffee</label>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q22\" value=\"B\" data-lq-radio=\"22\"> B) are reducing the demand for instant coffee</label>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q22\" value=\"C\" data-lq-radio=\"22\"> C) are improving the quality of instant coffee</label>\n              </div>\n              <div class=\"mcq\">\n                <div class=\"mcq-q\"><span class=\"qnum\">23</span> What do the speakers agree about Leo’s table of coffee products?</div>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q23\" value=\"A\" data-lq-radio=\"23\"> A) It needs more explanation in the text</label>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q23\" value=\"B\" data-lq-radio=\"23\"> B) It is factually inaccurate in some places</label>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q23\" value=\"C\" data-lq-radio=\"23\"> C) It would be best to put this in the appendix</label>\n              </div>\n              <div class=\"mcq\">\n                <div class=\"mcq-q\"><span class=\"qnum\">24</span> What do they decide about the description of Shaffers coffee as a market follower?</div>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q24\" value=\"A\" data-lq-radio=\"24\"> A) Leo needs to define his terms</label>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q24\" value=\"B\" data-lq-radio=\"24\"> B) Leo needs to provide more evidence</label>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q24\" value=\"C\" data-lq-radio=\"24\"> C) Leo needs to put it in a different section</label>\n              </div>\n              <div class=\"mcq\">\n                <div class=\"mcq-q\"><span class=\"qnum\">25</span> What does Anna say about originality in someone’s first marketing report?</div>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q25\" value=\"A\" data-lq-radio=\"25\"> A) Clear analysis of data can be considered original</label>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q25\" value=\"B\" data-lq-radio=\"25\"> B) Graphs and diagrams should be original, not copied</label>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q25\" value=\"C\" data-lq-radio=\"25\"> C) Reports should contain some original data collected by the student</label>\n              </div>\n              <div class=\"mcq\">\n                <div class=\"mcq-q\"><span class=\"qnum\">26</span> What difference between his school assignments and this report has surprised Leo?</div>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q26\" value=\"A\" data-lq-radio=\"26\"> A) not knowing the criteria for getting a good mark</label>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q26\" value=\"B\" data-lq-radio=\"26\"> B) being required to produce work without assistance</label>\n                <label class=\"mcq-opt\"><input type=\"radio\" name=\"q26\" value=\"C\" data-lq-radio=\"26\"> C) having to do a great deal of research</label>\n              </div>\n            </div>\n\n            <div class=\"listen-card\">\n              <div class=\"listen-card-title\">Questions 27–30</div>\n              <div class=\"listen-inst\">Complete the notes below. Write <b>ONE WORD ONLY</b> for each answer.</div>\n              <div class=\"listen-card-title\">Notes on specific sections of marketing report</div>\n              <div class=\"listen-notes\">\n                <div class=\"note-row\"><b>Executive summary</b></div>\n                <div class=\"note-row bullet\">Give a brief overview including the <span class=\"qnum\">27</span> <input data-lq=\"27\" class=\"l-input\"></div>\n                <div class=\"note-row\"><b>Problems</b></div>\n                <div class=\"note-row bullet\">Link each problem to a <span class=\"qnum\">28</span> <input data-lq=\"28\" class=\"l-input\"> which explains it</div>\n                <div class=\"note-row\"><b>Implementation</b></div>\n                <div class=\"note-row bullet\">Practical solutions to problems</div>\n                <div class=\"note-row bullet\">Include details such as participants, <span class=\"qnum\">29</span> <input data-lq=\"29\" class=\"l-input\"> and sequence</div>\n                <div class=\"note-row bullet\">Section is often poorly done because of lack of <span class=\"qnum\">30</span> <input data-lq=\"30\" class=\"l-input\"></div>\n                <div class=\"note-row\"><b>Conclusion</b></div>\n                <div class=\"note-row bullet\">Don’t use new material here</div>\n              </div>\n            </div>\n          </div>\n        </div>\n\n        <div class=\"listen-page hidden\" id=\"listenSec4\">\n          <div class=\"listen-block\">\n            <div class=\"listen-h\">SECTION 4 — Questions 31–40</div>\n            <div class=\"listen-card\">\n              <div class=\"listen-card-title\">Questions 31–40</div>\n              <div class=\"listen-inst\">Complete the notes below. Write <b>ONE WORD ONLY</b> for each answer.</div>\n              <div class=\"listen-card-title\">History of fireworks in Europe</div>\n              <div class=\"listen-notes\">\n                <div class=\"note-row\"><b>13th–16th centuries</b></div>\n                <div class=\"note-row bullet\">Fireworks were introduced from China</div>\n                <div class=\"note-row bullet\">Their use was mainly to do with war and <span class=\"qnum\">31</span> <input data-lq=\"31\" class=\"l-input\"> (in plays and festivals)</div>\n                <div class=\"note-row\"><b>17th century</b></div>\n                <div class=\"note-row bullet\">Various features of <span class=\"qnum\">32</span> <input data-lq=\"32\" class=\"l-input\"> were shown in fireworks displays</div>\n                <div class=\"note-row bullet\">Scientists were interested in using ideas from fireworks displays to make human <span class=\"qnum\">33</span> <input data-lq=\"33\" class=\"l-input\"> possible</div>\n                <div class=\"note-row bullet\">They also used them to show the formation of <span class=\"qnum\">34</span> <input data-lq=\"34\" class=\"l-input\"></div>\n                <div class=\"note-row\"><b>London</b></div>\n                <div class=\"note-row bullet\">Scientists were distrustful at first</div>\n                <div class=\"note-row bullet\">Later they investigated <span class=\"qnum\">35</span> <input data-lq=\"35\" class=\"l-input\"> uses of fireworks</div>\n                <div class=\"note-row\"><b>St Petersburg</b></div>\n                <div class=\"note-row bullet\">Fireworks were seen as a work of <span class=\"qnum\">36</span> <input data-lq=\"36\" class=\"l-input\"> for people</div>\n                <div class=\"note-row\"><b>Paris</b></div>\n                <div class=\"note-row bullet\">Displays emphasized the power of the <span class=\"qnum\">37</span> <input data-lq=\"37\" class=\"l-input\"></div>\n                <div class=\"note-row bullet\">Scientists aimed to provide <span class=\"qnum\">38</span> <input data-lq=\"38\" class=\"l-input\"></div>\n                <div class=\"note-row\"><b>18th century</b></div>\n                <div class=\"note-row bullet\">Italian fireworks specialists became influential</div>\n                <div class=\"note-row bullet\">Servandoni’s fireworks display followed the same pattern as an <span class=\"qnum\">39</span> <input data-lq=\"39\" class=\"l-input\"></div>\n                <div class=\"note-row bullet\">Some displays demonstrated new scientific discoveries such as <span class=\"qnum\">40</span> <input data-lq=\"40\" class=\"l-input\"></div>\n              </div>\n            </div>\n          </div>\n        </div>\n\n        <div class=\"listen-footer\">\n          <div class=\"muted\" id=\"listenAutosave\">Autosave: ready</div>\n          <button class=\"btn secondary\" id=\"downloadListeningBtn\" type=\"button\">Download Listening answers (JSON)</button>\n          <button class=\"btn secondary\" id=\"copyListeningBtn\" type=\"button\">Copy Listening answers</button>\n          <button class=\"btn\" id=\"submitListeningBtn\" type=\"button\">Submit Listening now</button>\n        </div>\n      "
  },
  "writing": {
    "task1Type": "Map",
    "task2Type": "Advantages and disadvantages",
    "task1Html": "You should spend about 20 minutes on this task.<br>\n        The two maps below show TV centre ten years ago and now.<br>\n        Summarize the information by selecting and reporting the main features and make comparisons where relevant.<br>\n        <b>Write at least 150 words.</b>",
    "task1ImageSrc": "https://audio.ieltsmock.org/enhanced_tv_centre.png",
    "task2Html": "You should spend about 40 minutes on this task.<br><br>\n        Many companies employ people from different age groups in the same team.<br>\n        <b>Do the advantages of this outweigh the disadvantages?</b><br>\n        Give reasons for your answer and include any relevant examples from your own knowledge or experience.<br>\n        <b>Write at least 250 words.</b>"
  },
  "reading": {
    "parts": [
      {
        "id": "part1",
        "passageText": "The hidden histories of exploration exhibition\n\nA We have all heard tales of lone, heroic explorers, but what about the local individuals who guided and protected European explorers in many different parts of the globe? Or the go-betweens – including interpreters and traders – who translated the needs and demands of explorers into a language that locals could understand? Such questions have received surprisingly little attention in standard histories, where European explorers are usually the heroes, sometimes the villains. The Hidden Histories of Exploration exhibition at Britain’s Royal Geographical Society in London sets out to present an alternative view, in which exploration is a fundamentally collective experience of work, involving many different people. Many of the most famous examples of explorers said to have been 'lone travellers' – say, Mungo Park or David Livingstone in Africa – were anything but 'alone' on their travels. They depended on local support of various kinds – for food, shelter, protection, information, guidance and solace – as well as on other resources from elsewhere.\n\nB The Royal Geographical Society (RGS) seeks to record this story in its Hidden Histories project, using its astonishingly rich collections. The storage of geographical information was one of the main rationales for the foundation of the RGS in 1830, and the Society’s collections now contain more than two million individual items, including books, manuscripts, maps, photographs, artworks, artefacts and film – a rich storehouse of material reflecting the wide geographical extent of British interest across the globe. In addition to their remarkable scope and range, these collections contain a striking visual record of exploration: the impulse to collect the world is reflected in a large and diverse image archive. For the researcher, this archive can yield many surprises: materials gathered for one purpose – say, maps relating to an international boundary dispute or photographs taken on a scientific expedition – may today be put to quite different uses.\n\nC In their published narratives, European explorers rarely portrayed themselves as vulnerable or dependent on others, despite the fact that without this support they were quite literally lost. Archival research confirms that Europeans were not merely dependent on the work of porters, soldiers, translators, cooks, pilots, guides, hunters and collectors: they also relied on local expertise. Such assistance was essential in identifying potential dangers – poisonous species, unpredictable rivers, uncharted territories – which could mean the difference between life and death. The assistants themselves were usually in a strong bargaining position. In the Amazon, for example, access to entire regions would depend on the willingness of local crew members and other assistants to enter areas inhabited by relatively powerful Amerindian groups. In an account of his journey across South America published in 1836, William Smyth thus complained of frequent desertion by his helpers: without them it was impossible to get on.\n\nD Those providing local support and information to explorers were themselves often not 'locals'. For example, the history of African exploration in the nineteenth century is dominated by the use of Zanzibar as a recruiting station for porters, soldiers and guides who would then travel thousands of miles across the continent. In some accounts, the leading African members of expedition parties – the 'officers' or 'foremen' – are identified, and their portraits published alongside those of European explorers.\n\nE The information provided by locals and intermediaries was of potential importance to geographical science. How was this evidence judged? The formal procedures of scientific evaluation provided one framework. Alongside these were more 'common sense' notions of veracity and reliability, religiously inspired judgments about the authenticity of testimony, and the routine procedures for cross-checking empirical observations developed in many professions.\n\nF Given explorers’ need for local information and support, it was in their interests to develop effective working partnerships with knowledgeable intermediaries who could act as brokers in their dealings with local inhabitants. Many of these people acquired far more experience of exploration than most Europeans could hope to attain. Some managed large groups of men and women, piloted the explorers’ river craft, or undertook mapping work. The tradition was continued with the Everest expeditions in the 1920s and 1930s, which regularly employed the Tibetan interpreter Karma Paul. In Europe, exploration was increasingly thought of as a career; the same might be said of the non-Europeans on whom their expeditions depended.\n\nG These individuals often forged close working relationships with European explorers. Such partnerships depended on mutual respect, though they were not always easy or intimate, as is particularly clear from the history of the Everest expeditions depicted in the Hidden Histories exhibition. The entire back wall is covered by an enlarged version of a single sheet of photographs of Sherpas taken during the 1936 Everest expedition. The document is a powerful reminder of the manpower on which European mountaineering expeditions depended, and also of the importance of local knowledge and assistance. Transformed from archive to wall display, it tells a powerful story through the medium of individual portraits – including Karma Paul, veteran of previous expeditions, and the young Tensing Norgay, 17 years before his successful 1953 ascent. This was a highly charged and transitional moment as the contribution of the Sherpas, depicted here with identity tags round their necks, was beginning to be much more widely recognised. These touching portraits encourage us to see them as agents rather than simply colonial subjects or paid employees. Here is a living history, which looks beyond what we already know about exploration: a larger history in which we come to recognise the contribution of everyone involved.",
        "blocks": [
          {
            "type": "tfng",
            "title": "Questions 1–7",
            "instructions": [
              "Do the following statements agree with the information given in Reading Passage 1?",
              "Choose TRUE / FALSE / NOT GIVEN."
            ],
            "items": [
              {
                "q": 1,
                "text": "The Hidden Histories of Exploration exhibition aims to show the wide range of people involved in expeditions."
              },
              {
                "q": 2,
                "text": "The common belief about how Park and Livingstone travelled is accurate."
              },
              {
                "q": 3,
                "text": "The RGS has organised a number of exhibitions since it was founded."
              },
              {
                "q": 4,
                "text": "Some of the records in the RGS archives are more useful than others."
              },
              {
                "q": 5,
                "text": "Materials owned by the RGS can be used in ways that were not originally intended."
              },
              {
                "q": 6,
                "text": "In their publications, European explorers often describe their dependence on their helpers."
              },
              {
                "q": 7,
                "text": "Local helpers refused to accompany William Smyth during parts of his journey."
              }
            ]
          },
          {
            "type": "endingsMatch",
            "title": "Questions 8–13",
            "instructions": [
              "Reading Passage 1 has seven paragraphs, A–G.",
              "Which paragraph contains the following information?",
              "You may use any letter more than once."
            ],
            "endings": {
              "A": "Paragraph A",
              "B": "Paragraph B",
              "C": "Paragraph C",
              "D": "Paragraph D",
              "E": "Paragraph E",
              "F": "Paragraph F",
              "G": "Paragraph G"
            },
            "items": [
              {
                "q": 8,
                "text": "reference to the distances that some non-European helpers travelled"
              },
              {
                "q": 9,
                "text": "description of a wide range of different types of documents"
              },
              {
                "q": 10,
                "text": "belief about the effect of an exhibition on people seeing it"
              },
              {
                "q": 11,
                "text": "examples of risks explorers might have been unaware of without local help"
              },
              {
                "q": 12,
                "text": "reference to various approaches to assessing data from local helpers"
              },
              {
                "q": 13,
                "text": "reference to people whose long-term occupation was to organise local assistance for European explorers"
              }
            ]
          }
        ]
      },
      {
        "id": "part2",
        "passageText": "Fatal Attraction\n\nEvolutionist Charles Darwin first marvelled at flesh-eating plants in the mid-19th century. Today, biologists, using 21st-century tools to study cells and DNA, are beginning to understand how these plants hunt, eat and digest – and how such bizarre adaptations arose in the first place.\n\nA The leaves of the Venus flytrap plant are covered in hairs. When an insect brushes against them, this triggers a tiny electric charge, which travels down tunnels in the leaf and opens up pores in the leaf’s cell membranes. Water surges from the cells on the inside of the leaf to those on the outside, causing the leaf to rapidly flip in shape from convex to concave, like a soft contact lens. As the leaves flip, they snap together, trapping the insect in their sharp-toothed jaws.\n\nB The bladderwort has an equally sophisticated way of setting its underwater trap. It pumps water out of tiny bag-like bladders, making a vacuum inside. When small creatures swim past, they bend the hairs on the bladder, causing a flap to open. The low pressure sucks water in, carrying the animal along with it. In one five-hundredth of a second, the door swings shut again. The Drosera sundew, meanwhile, has a thick, sweet liquid oozing from its leaves, which first attracts insects, then holds them fast before the leaves snap shut. Pitcher plants use yet another strategy, growing long tube-shaped leaves to imprison their prey. Raffles’ pitcher plant, from the jungles of Borneo, produces nectar that both lures insects and forms a slick surface on which they can’t get a grip. Insects that land on the rim of the pitcher slide on the liquid and tumble in.\n\nC Many carnivorous plants secrete enzymes to penetrate the hard exoskeleton of insects so they can absorb nutrients from inside their prey. But the purple pitcher plant, which lives in bogs and infertile sandy soils in North America, enlists other organisms to process its food. It is home to an intricate food web of mosquito larvae, midges and bacteria, many of which can survive only in this unique habitat. These animals shred the prey that fall into the pitcher, and the smaller organisms feed on the debris. Finally, the plant absorbs the nutrients released.\n\nD While such plants clearly thrive on being carnivorous, the benefits of eating flesh are not the ones you might expect. Carnivorous animals such as ourselves use the carbon in protein and the fat in meat to build muscles and store energy. Carnivorous plants instead draw nitrogen, phosphorus, and other critical nutrients from their prey in order to build light-harvesting enzymes. Eating animals, in other words, lets carnivorous plants do what all plants do: carry out photosynthesis, that is, grow by harnessing energy directly from the sun.\n\nE Carnivorous plants are, in fact, very inefficient at converting sunlight into tissue. This is because of all the energy they expend to make the equipment to catch animals – the enzymes, the pumps, and so on. A pitcher or a flytrap cannot carry out much photosynthesis because, unlike plants with ordinary leaves, they do not have flat solar panels that can grab lots of sunlight. There are, however, some special conditions in which the benefits of being carnivorous do outweigh the costs. The poor soil of bogs, for example, offers little nitrogen and phosphorus, so carnivorous plants enjoy an advantage over plants that obtain these nutrients by more conventional means. Bogs are also flooded with sunshine, so even an inefficient carnivorous plant can photosynthesise enough light to survive.\n\nF Evolution has repeatedly made this trade-off. By comparing the DNA of carnivorous plants with other species, scientists have found that they evolved independently on at least six separate occasions. Some carnivorous plants that look nearly identical turn out to be only distantly related. The two kinds of pitcher plants – the tropical genus Nepenthes and the North American Sarracenia – have, surprisingly, evolved from different ancestors, although both grow deep pitcher-shaped leaves and employ the same strategy for capturing prey.\n\nG In several cases, scientists can see how complex carnivorous plants evolved from simpler ones. Venus flytraps, for example, share an ancestor with Portuguese sundews, which only catch prey passively, via 'flypaper' glands on their stems. They share a more recent ancestor with Drosera sundews, which can also curl their leaves over their prey. Venus flytraps appear to have evolved an even more elaborate version of this kind of trap, complete with jaw-like leaves.\n\nH Unfortunately, the adaptations that enable carnivorous plants to thrive in marginal habitats also make them exquisitely sensitive. Agricultural run-off and pollution from power plants are adding extra nitrogen to many bogs in North America. Carnivorous plants are so finely tuned to low levels of nitrogen that this extra fertilizer is overloading their systems, and they eventually burn themselves out and die.\n\nI Humans also threaten carnivorous plants in other ways. The black market trade in exotic carnivorous plants is so vigorous now that botanists are keeping the location of some rare species a secret. But even if the poaching of carnivorous plants can be halted, they will continue to suffer from other assaults. In the pine savannah of North Carolina, the increasing suppression of fires is allowing other plants to grow too quickly and outcompete the flytraps in their native environment. Good news, perhaps, for flies. But a loss for all who, like Darwin, delight in the sheer inventiveness of evolution.",
        "blocks": [
          {
            "type": "sentenceGaps",
            "title": "Questions 14–18",
            "instructions": [
              "Complete the notes below.",
              "Choose NO MORE THAN TWO WORDS from the passage for each answer."
            ],
            "items": [
              {
                "q": 14,
                "text": "Insect touches",
                "tail": " on leaf of plant"
              },
              {
                "q": 15,
                "text": "Small",
                "tail": " passes through leaf"
              },
              {
                "q": 16,
                "text": "",
                "leadingBlank": true,
                "text2": " in cell membrane open"
              },
              {
                "q": 17,
                "text": "Outside cells of leaves fill with",
                "tail": ""
              },
              {
                "q": 18,
                "text": "Leaves change so that they have a",
                "tail": " shape and snap shut"
              }
            ]
          },
          {
            "type": "endingsMatch",
            "title": "Questions 19–22",
            "instructions": [
              "Match each statement with the correct plant, A–E.",
              "Write the correct letter, A, B, C, D or E."
            ],
            "endings": {
              "A": "Venus flytrap",
              "B": "Bladderwort",
              "C": "Drosera sundew",
              "D": "Raffles’ pitcher plant",
              "E": "Purple pitcher plant"
            },
            "items": [
              {
                "q": 19,
                "text": "It uses other creatures to help it digest insects."
              },
              {
                "q": 20,
                "text": "It produces a slippery substance to make insects fall inside it."
              },
              {
                "q": 21,
                "text": "It creates an empty space into which insects are sucked."
              },
              {
                "q": 22,
                "text": "It produces a sticky substance which traps insects on its surface."
              }
            ]
          },
          {
            "type": "endingsMatch",
            "title": "Questions 23–26",
            "instructions": [
              "Reading Passage 2 has nine paragraphs, A–I.",
              "Which paragraph contains the following information?",
              "You may use any letter more than once."
            ],
            "endings": {
              "A": "Paragraph A",
              "B": "Paragraph B",
              "C": "Paragraph C",
              "D": "Paragraph D",
              "E": "Paragraph E",
              "F": "Paragraph F",
              "G": "Paragraph G",
              "H": "Paragraph H",
              "I": "Paragraph I"
            },
            "items": [
              {
                "q": 23,
                "text": "a mention of a disadvantage of the leaf shape of some carnivorous plants"
              },
              {
                "q": 24,
                "text": "an example of an effort made to protect carnivorous plants"
              },
              {
                "q": 25,
                "text": "unexpected information about the origins of certain carnivorous plants"
              },
              {
                "q": 26,
                "text": "an example of environmental changes that shorten the life cycles of carnivorous plants"
              }
            ]
          }
        ]
      },
      {
        "id": "part3",
        "passageText": "Want to be friends?\n\nA For many hundreds of thousands of people worldwide, online networking has become enmeshed in our daily lives. However, it is a decades-old insight from a study of traditional social networks that best illuminates one of the most important aspects of today’s online networking. In 1973 sociologist Mark Granovetter showed how the loose acquaintances, or 'weak ties', in our social network exert a disproportionate influence over our behaviour and choices. Granovetter’s research showed that a significant percentage of people get their jobs as a result of recommendations or advice provided by a weak tie. Today our number of weak-tie contacts has exploded via online social networking. 'You couldn’t maintain all of those weak ties on your own,' says Jennifer Golbeck of the University of Maryland. 'Online sites, such as Facebook, give you a way of cataloguing them.' The result? It’s now significantly easier for the schoolfriend you haven’t seen in years to pass you a tip that alters your behaviour, from recommendation of a low-cholesterol breakfast cereal to a party invite where you meet your future wife or husband.\n\nB The explosion of weak ties could have profound consequences for our social structures too, according to Judith Donath of the Berkman Center for Internet and Society at Harvard University. 'We’re already seeing changes,' she says. For example, many people now turn to their online social networks ahead of sources such as newspapers and television for trusted and relevant news or information. What they hear could well be inaccurate, but the change is happening nonetheless. If these huge 'supernets' – some of them numbering up to 5,000 people – continue to thrive and grow, they could fundamentally change the way we share information and transform our notions of relationships.\n\nC But are these vast networks really that relevant to us on a personal level? Robin Dunbar, an evolutionary anthropologist at the University of Oxford, believes that our primate brains place a cap on the number of genuine social relationships we can actually cope with: roughly 150. According to Dunbar, online social networking appears to be very good for 'servicing' relationships, but not for establishing them. He argues that our evolutionary roots mean we still depend heavily on physical and face-to-face contact to be able to create ties.\n\nD Nonetheless, there is evidence that online networking can transform our daily interactions. In an experiment at Cornell University, psychologist Jeff Hancock asked participants to try to encourage other participants to like them via instant messaging conversation. Beforehand, some members of the trial were allowed to view the Facebook profile of the person they were trying to win over. He found that those with Facebook access asked questions to which they already knew the answers or raised things they had in common, and as result were much more successful in their social relationships. Hancock concluded that people who use these sites to keep updated on the activities of their acquaintances are more likely to be liked in subsequent social interactions.\n\nE Online social networking may also have tangible effects on our well-being. Nicole Ellison of Michigan State University found that the frequency of networking site use correlates with greater self-esteem. Support and affirmation from the weak ties could be the explanation, says Ellison. 'Asking your close friends for help or advice is nothing new, but we are seeing a lowering of barriers among acquaintances,' she says. People are readily sharing personal feelings and experiences to a wider circle than they might once have done. Sandy Pentland at the Massachusetts Institute of Technology agrees. 'The ability to broadcast to our social group means we need never feel alone,' he says. 'The things that befall us are often due to a lack of social support. There’s more of a safety net now.'\n\nF Henry Holzman, also at MIT, who studies the interface between online social networking and the real world, points out that increased visibility also means our various social spheres – family, work, friends – are merging, and so we will have to prepare for new societal norms. 'We’ll have to learn how to live a more transparent life,' he says. 'We may have to give up some ability to show very limited glimpses of ourselves to others.'\n\nG Another way that online networking appears to be changing our social structures is through dominance. In one repeated experiment, Michael Kearns of the University of Pennsylvania asked 30 volunteers to quickly reach consensus in an online game over a choice between two colours. Each person was offered a cash reward if they succeeded in persuading the group to pick one or other colour. All participants could see the colour chosen by some of the other people, but certain participants had an extra advantage: the ability to see more of the participants’ chosen colours than others. Every time Kearns found that those who could see the choices of more participants (in other words, were better connected) persuaded the group to pick their colour, even when they had to persuade the vast majority to give up their financial incentive. While Kearns warns that the setting was artificial, he says it’s possible that greater persuasive power could lie with well-connected individuals in the everyday online world too.",
        "blocks": [
          {
            "type": "headings",
            "title": "Questions 27–32",
            "instructions": [
              "Reading Passage 3 has seven paragraphs, A–G.",
              "Choose the correct heading for paragraphs B–G from the list of headings below."
            ],
            "listTitle": "List of Headings",
            "headings": [
              {
                "value": "i",
                "label": "A shift in our fact-finding habits"
              },
              {
                "value": "ii",
                "label": "How to be popular"
              },
              {
                "value": "iii",
                "label": "More personal information being known"
              },
              {
                "value": "iv",
                "label": "The origins of online social networks"
              },
              {
                "value": "v",
                "label": "The link between knowledge and influence"
              },
              {
                "value": "vi",
                "label": "Information that could change how you live"
              },
              {
                "value": "vii",
                "label": "The emotional benefits of online networking"
              },
              {
                "value": "viii",
                "label": "A change in how we view our online friendships"
              },
              {
                "value": "ix",
                "label": "The future of networking"
              },
              {
                "value": "x",
                "label": "Doubts about the value of online socialising"
              }
            ],
            "questions": [
              {
                "q": 27,
                "paragraph": "Paragraph B"
              },
              {
                "q": 28,
                "paragraph": "Paragraph C"
              },
              {
                "q": 29,
                "paragraph": "Paragraph D"
              },
              {
                "q": 30,
                "paragraph": "Paragraph E"
              },
              {
                "q": 31,
                "paragraph": "Paragraph F"
              },
              {
                "q": 32,
                "paragraph": "Paragraph G"
              }
            ]
          },
          {
            "type": "endingsMatch",
            "title": "Questions 33–36",
            "instructions": [
              "Match each finding with the correct researcher, A–F.",
              "Write the correct letter, A–F."
            ],
            "endings": {
              "A": "Mark Granovetter",
              "B": "Judith Donath",
              "C": "Robin Dunbar",
              "D": "Jeff Hancock",
              "E": "Nicole Ellison",
              "F": "Michael Kearns"
            },
            "items": [
              {
                "q": 33,
                "text": "People who network widely may be more able to exert pressure on others."
              },
              {
                "q": 34,
                "text": "We have become more willing to confide in an extensive number of people."
              },
              {
                "q": 35,
                "text": "There is a limit to how many meaningful relationships we can maintain."
              },
              {
                "q": 36,
                "text": "There is a social advantage in knowing about the lives of our online contacts."
              }
            ]
          },
          {
            "type": "multiTextChoices",
            "title": "Questions 37–40",
            "instructions": [
              "For Questions 37–40, choose the correct letter, A–E.",
              "Questions 37 and 38 ask for TWO advantages mentioned in the passage.",
              "Questions 39 and 40 ask for TWO disadvantages mentioned in the passage."
            ],
            "choices": [
              {
                "letter": "A",
                "text": "Information from online social contacts may be unreliable."
              },
              {
                "letter": "B",
                "text": "Online socialising is an efficient way of keeping in touch with a lot of people."
              },
              {
                "letter": "C",
                "text": "It is very easy to establish new friendships online."
              },
              {
                "letter": "D",
                "text": "Online social networking can solve problems in real-world relationships."
              },
              {
                "letter": "E",
                "text": "It can be reassuring to be part of an online social network."
              }
            ],
            "items": [
              {
                "q": 37,
                "text": "Advantage mentioned 1"
              },
              {
                "q": 38,
                "text": "Advantage mentioned 2"
              },
              {
                "q": 39,
                "text": "Disadvantage mentioned 1"
              },
              {
                "q": 40,
                "text": "Disadvantage mentioned 2"
              }
            ]
          }
        ]
      }
    ]
  }
};

const test5 = {
    listening: {
      audioSrc: "https://audio.ieltsmock.org/test5.mp3",
      html: `
        <div class="listen-page" id="listenSec1">
          <div class="listen-block">
            <div class="listen-h">SECTION 1 - Questions 1-10</div>
            <div class="listen-card">
              <div class="listen-card-title">Questions 1-10</div>
              <div class="listen-inst">Complete the notes below. Write <b>NO MORE THAN ONE WORD OR A NUMBER</b> for each answer.</div>
              <div class="listen-card-title">Accommodation form: rental properties</div>
              <div class="listen-notes">
                <div class="note-row">Name: Jane Ryder</div>
                <div class="note-row">Contact phone number: <span class="qnum">1</span> 0044 <input data-lq="1" class="l-input"></div>
                <div class="note-row">Email address: <span class="qnum">2</span> richard@ <input data-lq="2" class="l-input"> co.uk</div>
                <div class="note-row">Occupation: a local <span class="qnum">3</span> <input data-lq="3" class="l-input"></div>
                <div class="note-row">Type of accommodation: a 2 bedroom apartment wanted (must have its own <span class="qnum">4</span> <input data-lq="4" class="l-input tiny">)</div>
                <div class="note-row">No <span class="qnum">5</span> <input data-lq="5" class="l-input tiny"> required</div>
                <div class="note-row">A <span class="qnum">6</span> <input data-lq="6" class="l-input tiny"> in the kitchen is preferable</div>
                <div class="note-row">Preferred location: near a <span class="qnum">7</span> <input data-lq="7" class="l-input tiny"></div>
                <div class="note-row">Maximum rent: <span class="qnum">8</span> <input data-lq="8" class="l-input tiny"> per month</div>
                <div class="note-row">Other requests: the accommodation has to be <span class="qnum">9</span> <input data-lq="9" class="l-input tiny"> in the daytime</div>
                <div class="note-row">How did you first hear about us? Through a <span class="qnum">10</span> <input data-lq="10" class="l-input tiny"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="listen-page hidden" id="listenSec2">
          <div class="listen-block">
            <div class="listen-h">SECTION 2 - Questions 11-20</div>
            <div class="listen-card">
              <div class="listen-card-title">Questions 11-15</div>
              <div class="listen-inst">Complete the sentences below. Write <b>NO MORE THAN TWO WORDS</b> for each answer.</div>
              <div class="note-row">The police officer suggests neighbours give each other their <span class="qnum">11</span> <input data-lq="11" class="l-input"></div>
              <div class="note-row">Neighbours should discuss what to do if there's any kind of <span class="qnum">12</span> <input data-lq="12" class="l-input"></div>
              <div class="note-row">It is a good idea to leave on the <span class="qnum">13</span> <input data-lq="13" class="l-input"></div>
              <div class="note-row">Think carefully about where you put any <span class="qnum">14</span> <input data-lq="14" class="l-input"></div>
              <div class="note-row">It is a good idea to buy good-quality <span class="qnum">15</span> <input data-lq="15" class="l-input"></div>
            </div>

            <div class="listen-card">
              <div class="listen-card-title">Questions 16-20</div>
              <div class="listen-inst">Choose <b>FIVE</b> answers from the box and write the correct letter, <b>A-G</b>, next to Questions 16-20.</div>
              <div class="optionsGrid">
                <div class="optCell"><b>A</b> install more lighting</div>
                <div class="optCell"><b>B</b> have more police officers on patrol</div>
                <div class="optCell"><b>C</b> remove surrounding vegetation</div>
                <div class="optCell"><b>D</b> contact local police</div>
                <div class="optCell"><b>E</b> fix damage quickly</div>
                <div class="optCell"><b>F</b> change road design</div>
                <div class="optCell"><b>G</b> use security cameras</div>
              </div>
              <div class="note-row"><span class="qnum">16</span> skate park <input data-lq="16" class="l-input tiny"></div>
              <div class="note-row"><span class="qnum">17</span> local primary schools <input data-lq="17" class="l-input tiny"></div>
              <div class="note-row"><span class="qnum">18</span> Abbostford street <input data-lq="18" class="l-input tiny"></div>
              <div class="note-row"><span class="qnum">19</span> shops on Victoria street <input data-lq="19" class="l-input tiny"></div>
              <div class="note-row"><span class="qnum">20</span> supermarket car park <input data-lq="20" class="l-input tiny"></div>
            </div>
          </div>
        </div>

        <div class="listen-page hidden" id="listenSec3">
          <div class="listen-block">
            <div class="listen-h">SECTION 3 - Questions 21-30</div>
            <div class="listen-card">
              <div class="listen-card-title">Questions 21-26</div>
              <div class="listen-inst">Choose the correct letter, <b>A, B or C</b>.</div>

              <div class="mcq">
                <div class="mcq-q"><span class="qnum">21</span> Mike suggests they begin their presentation by</div>
                <label class="mcq-opt"><input type="radio" name="q21" value="A" data-lq-radio="21"> A) explaining what kind of harm is caused by fossil fuels.</label>
                <label class="mcq-opt"><input type="radio" name="q21" value="B" data-lq-radio="21"> B) pointing out that biofuels were in use before fossil fuels.</label>
                <label class="mcq-opt"><input type="radio" name="q21" value="C" data-lq-radio="21"> C) ensuring students know the difference between fossil fuels and biofuels.</label>
              </div>

              <div class="mcq">
                <div class="mcq-q"><span class="qnum">22</span> Karina doesn't want to discuss the production of ethanol because</div>
                <label class="mcq-opt"><input type="radio" name="q22" value="A" data-lq-radio="22"> A) other students will already be familiar with the process.</label>
                <label class="mcq-opt"><input type="radio" name="q22" value="B" data-lq-radio="22"> B) there will not be time to cover more important information.</label>
                <label class="mcq-opt"><input type="radio" name="q22" value="C" data-lq-radio="22"> C) they may not provide an accurate description.</label>
              </div>

              <div class="mcq">
                <div class="mcq-q"><span class="qnum">23</span> Which source of biofuel do the students agree is least environmentally friendly?</div>
                <label class="mcq-opt"><input type="radio" name="q23" value="A" data-lq-radio="23"> A) sugar cane</label>
                <label class="mcq-opt"><input type="radio" name="q23" value="B" data-lq-radio="23"> B) corn</label>
                <label class="mcq-opt"><input type="radio" name="q23" value="C" data-lq-radio="23"> C) canola</label>
              </div>

              <div class="mcq">
                <div class="mcq-q"><span class="qnum">24</span> What is the main problem facing the development of the biofuel industry in the USA?</div>
                <label class="mcq-opt"><input type="radio" name="q24" value="A" data-lq-radio="24"> A) inadequate infrastructure for transporting ethanol</label>
                <label class="mcq-opt"><input type="radio" name="q24" value="B" data-lq-radio="24"> B) not enough farmers growing biofuel crops</label>
                <label class="mcq-opt"><input type="radio" name="q24" value="C" data-lq-radio="24"> C) little government support of biofuel development</label>
              </div>

              <div class="mcq">
                <div class="mcq-q"><span class="qnum">25</span> Karina doubts that sugar cane production in Brazil will</div>
                <label class="mcq-opt"><input type="radio" name="q25" value="A" data-lq-radio="25"> A) lead to the loss of wildlife habitats.</label>
                <label class="mcq-opt"><input type="radio" name="q25" value="B" data-lq-radio="25"> B) create a large number of jobs in the biofuel sector.</label>
                <label class="mcq-opt"><input type="radio" name="q25" value="C" data-lq-radio="25"> C) continue to provide enough energy for the country's needs.</label>
              </div>

              <div class="mcq">
                <div class="mcq-q"><span class="qnum">26</span> Karina and Mike conclude that in order to increase the use of biofuels</div>
                <label class="mcq-opt"><input type="radio" name="q26" value="A" data-lq-radio="26"> A) the price of fossil fuels must go up.</label>
                <label class="mcq-opt"><input type="radio" name="q26" value="B" data-lq-radio="26"> B) more machinery must be adapted to use them.</label>
                <label class="mcq-opt"><input type="radio" name="q26" value="C" data-lq-radio="26"> C) production methods must be more energy-efficient.</label>
              </div>
            </div>

            <div class="listen-card">
              <div class="listen-card-title">Questions 27-30</div>
              <div class="listen-inst">Answer the questions below. Write <b>NO MORE THAN TWO WORDS</b> for each answer.</div>
              <div class="listen-notes">
                <div class="listen-card-title">What TWO biofuel-related problems do Mike and Karina decide to focus on in the last section of their presentation?</div>
                <div class="note-row">• <span class="qnum">27</span> <input data-lq="27" class="l-input"></div>
                <div class="note-row">• <span class="qnum">28</span> <input data-lq="28" class="l-input"></div>
                <div class="listen-card-title" style="margin-top:18px;">Which two sources of biofuel do Mike and Karina say are being tried out?</div>
                <div class="note-row">• <span class="qnum">29</span> <input data-lq="29" class="l-input"></div>
                <div class="note-row">• algae</div>
                <div class="note-row">• <span class="qnum">30</span> <input data-lq="30" class="l-input"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="listen-page hidden" id="listenSec4">
          <div class="listen-block">
            <div class="listen-h">SECTION 4 - Questions 31-40</div>
            <div class="listen-card">
              <div class="listen-card-title">Part 4: Questions 31-34</div>
              <div class="listen-inst">Complete the notes below. Write <b>ONE WORD ONLY</b> for each answer.</div>
              <div class="listen-card-title">The 'weak-tie' theory: how friends-of-friends influence us</div>
              <div class="listen-notes">
                <div class="note-row">In 1973, Mark Granovetter claimed that the influence of 'weak-ties' can affect the behaviour of populations in the fields of information science, politics and <span class="qnum">31</span> <input data-lq="31" class="l-input"></div>
                <div class="note-row">Although friends-of-friends may be unlike us, they have similar enough <span class="qnum">32</span> <input data-lq="32" class="l-input"> to have a beneficial effect on our lives.</div>
                <div class="note-row">An example of this influence is when we hear about <span class="qnum">33</span> <input data-lq="33" class="l-input"> Because information about them is provided by weak-ties.</div>
                <div class="note-row">Since Granovetter proposed his theory, other studies have shown that weak-tie networks also benefit our <span class="qnum">34</span> <input data-lq="34" class="l-input"></div>
              </div>
            </div>

            <div class="listen-card">
              <div class="listen-card-title">Questions 35 and 36</div>
              <div class="listen-inst">Choose <b>TWO</b> letters, <b>A-E</b>.</div>
              <div class="mcq-q">Which does the speaker believe are TWO real benefits of online social networking?</div>
              <label class="mcq-opt" for="lq35a"><input id="lq35a" name="lq35group" type="checkbox" data-lq-check="35" value="A" autocomplete="off"> A) people can gain higher self-esteem</label>
              <label class="mcq-opt" for="lq35b"><input id="lq35b" name="lq35group" type="checkbox" data-lq-check="35" value="B" autocomplete="off"> B) people can access useful medical information</label>
              <label class="mcq-opt" for="lq35c"><input id="lq35c" name="lq35group" type="checkbox" data-lq-check="35" value="C" autocomplete="off"> C) people can form relationships more quickly</label>
              <label class="mcq-opt" for="lq35d"><input id="lq35d" name="lq35group" type="checkbox" data-lq-check="35" value="D" autocomplete="off"> D) people can improve academic performance</label>
              <label class="mcq-opt" for="lq35e"><input id="lq35e" name="lq35group" type="checkbox" data-lq-check="35" value="E" autocomplete="off"> E) people can be reliably informed about current affairs</label>
            </div>

            <div class="listen-card">
              <div class="listen-card-title">Questions 37 and 38</div>
              <div class="listen-inst">Choose <b>TWO</b> letters, <b>A-E</b>.</div>
              <div class="mcq-q">Which TWO problems related to online social networking will increase, according to the speaker?</div>
              <label class="mcq-opt" for="lq37a"><input id="lq37a" name="lq37group" type="checkbox" data-lq-check="37" value="A" autocomplete="off"> A) criminal activity</label>
              <label class="mcq-opt" for="lq37b"><input id="lq37b" name="lq37group" type="checkbox" data-lq-check="37" value="B" autocomplete="off"> B) poorer grades at school</label>
              <label class="mcq-opt" for="lq37c"><input id="lq37c" name="lq37group" type="checkbox" data-lq-check="37" value="C" autocomplete="off"> C) a decline in physical fitness</label>
              <label class="mcq-opt" for="lq37d"><input id="lq37d" name="lq37group" type="checkbox" data-lq-check="37" value="D" autocomplete="off"> D) less work done by employees</label>
              <label class="mcq-opt" for="lq37e"><input id="lq37e" name="lq37group" type="checkbox" data-lq-check="37" value="E" autocomplete="off"> E) loss of career prospects</label>
            </div>

            <div class="listen-card">
              <div class="listen-card-title">Questions 39 and 40</div>
              <div class="listen-inst">Choose <b>TWO</b> letters, <b>A-E</b>.</div>
              <div class="mcq-q">Which TWO claims are made by Robin Dunbar about social networking sites?</div>
              <label class="mcq-opt" for="lq39a"><input id="lq39a" name="lq39group" type="checkbox" data-lq-check="39" value="A" autocomplete="off"> A) They are not helpful for developing certain social skills.</label>
              <label class="mcq-opt" for="lq39b"><input id="lq39b" name="lq39group" type="checkbox" data-lq-check="39" value="B" autocomplete="off"> B) They cannot fully reveal a person's real character.</label>
              <label class="mcq-opt" for="lq39c"><input id="lq39c" name="lq39group" type="checkbox" data-lq-check="39" value="C" autocomplete="off"> C) They are not a good starting point for building new relationships.</label>
              <label class="mcq-opt" for="lq39d"><input id="lq39d" name="lq39group" type="checkbox" data-lq-check="39" value="D" autocomplete="off"> D) They do not encourage people to widen their social circle.</label>
              <label class="mcq-opt" for="lq39e"><input id="lq39e" name="lq39group" type="checkbox" data-lq-check="39" value="E" autocomplete="off"> E) They will not retain their popularity with the young generation.</label>
            </div>
          </div>
        </div>
      `,
    },

    writing: {
      task1Type: "Table",
      task2Type: "Discussion essay",
      task1Html: `
        You should spend about 20 minutes on this task.<br>
        The table below shows information about spending on health in five different countries in 2002.<br>
        Summarize the information by selecting and reporting the main features, and make comparisons where relevant.<br>
        <b>Write at least 150 words.</b>
      `,
      task1ImageSrc: "https://audio.ieltsmock.org/unnamed.png",
      task2Html: `
        You should spend about 40 minutes on this task.<br><br>
        Some people believe that children that commit crimes should be punished. Others think the parents should be punished instead.<br>
        <b>Discuss both views and give your own opinion.</b><br>
        Give reasons for your answer and include any relevant examples from your own knowledge or experience.<br>
        <b>Write at least 250 words.</b>
      `,
    },

    reading: {
      parts: [
        {
          id: "part1",
          passageText: `Why Are Finland's Schools Successful?

A
 At Kirkkojarvi Comprehensive School in Espoo, a suburb west of Helsinki, Kari Louhivuori, the school's principal, decided to try something extreme by Finnish standards. One of his sixth-grade students, a recent immigrant, was falling behind, resisting his teacher's best efforts. So he decided to hold the boy back a year. Standards in the country have vastly improved in reading, math and science literacy over the past decade, in large part because its teachers are trusted to do whatever it takes to turn young lives around. 'I took Besart on that year as my private student,' explains Louhivuori. When he was not studying science, geography and math, Besart was seated next to Louhivuori's desk, taking books from a tall stack, slowly reading one, then another, then devouring them by the dozens. By the end of the year, he had conquered his adopted country's vowel-rich language and arrived at the realization that he could, in fact, learn.


B
 This tale of a single rescued child hints at some of the reasons for Finland's amazing record of education success. The transformation of its education system began some 40 years ago but teachers had little idea it had been so successful until 2000. In this year, the first results from the Programme for International Student Assessment (PISA), a standardized test given to 15-year-olds in more than 40 global venues, revealed Finnish youth to be the best at reading in the world. Three years later, they led in math. By 2006, Finland was first out of the 57 nations that participate in science. In the latest PISA scores, the nation came second in science, third in reading and sixth in math among nearly half a million students worldwide.


C
 In the United States, government officials have attempted to improve standards by introducing marketplace competition into public schools. In recent years, a group of Wall Street financiers and philanthropists such as Bill Gates have put money behind private-sector ideas, such as charter schools, which have doubled in number in the past decade. President Obama, too, apparently thought competition was the answer. One policy invited states to compete for federal dollars using tests and other methods to measure teachers, a philosophy that would not be welcome in Finland. 'I think, in fact, teachers would tear off their shirts,' said Timo Heikkinen, a Helsinki principal with 24 years of teaching experience. 'If you only measure the statistics, you miss the human aspect.'


D
 There are no compulsory standardized tests in Finland, apart from one exam at the end of students' senior year in high school. There is no competition between students, schools or regions. Finland's schools are publicly funded. The people in the government agencies running them, from national officials to local authorities, are educators rather than business people or politicians. Every school has the same national goals and draws from the same pool of university-trained educators. The result is that a Finnish child has a good chance of getting the same quality education no matter whether he or she lives in a rural village or a university town.


E
 It's almost unheard of for a child to show up hungry to school. Finland provides three years of maternity leave and subsidized day care to parents, and preschool for all five-year-olds, where the emphasis is on socializing. In addition, the state subsidizes parents, paying them around 150 euros per month for every child until he or she turns 17. Schools provide food, counseling and taxi service if needed. Health care is even free for students taking degree courses.


F
 Finland's schools were not always a wonder. For the first half of the twentieth century, only the privileged got a quality education. But In 1963, the Finnish Parliament made the bold decision to choose public education as the best means of driving the economy forward and out of recession. Public schools were organized into one system of comprehensive schools for ages 7 through 16. Teachers from all over the nation contributed to a national curriculum that provided guidelines, not prescriptions, for them to refer to. Besides Finnish and Swedish (the country's second official language), children started learning a third language (English is a favorite) usually beginning at age nine. The equal distribution of equipment was next, meaning that all teachers had their fair share of teaching resources to aid learning. As the comprehensive schools improved, so did the upper secondary schools (grades 10 through 12). The second critical decision came in 1979, when it was required that every teacher gain a fifth-year Master's degree in theory and practice, paid for by the state. From then on, teachers were effectively granted equal status with doctors and lawyers. Applicants began flooding teaching programs, not because the salaries were so high but because autonomous decision making and respect made the job desirable. And as Louhivuori explains, 'We have our own motivation to succeed because we love the work.'`,
          blocks: [
            {
              type: "headings",
              title: "Questions 1-6",
              instructions: [
                "Reading Passage 1 has six paragraphs, A-F.",
                "Choose the correct heading for each paragraph from the list of headings below.",
                "Write the correct number, i-ix, in boxes 1-6 on your answer sheet.",
              ],
              listTitle: "List of Headings",
              headings: [
                { value: "i", label: "A business-model approach to education" },
                { value: "ii", label: "The reforms that improved education in Finland" },
                { value: "iii", label: "Educational challenges of the future" },
                { value: "iv", label: "Ways in which equality is maintained in the Finnish education system" },
                { value: "v", label: "The benefits of the introduction of testing" },
                { value: "vi", label: "An approach that helped a young learner" },
                { value: "vii", label: "Statistical proof of education success" },
                { value: "viii", label: "Support for families working and living in Finland" },
                { value: "ix", label: "The impact of the education system on Finland's economy" },
              ],
              questions: [
                { q: 1, paragraph: "Paragraph A" },
                { q: 2, paragraph: "Paragraph B" },
                { q: 3, paragraph: "Paragraph C" },
                { q: 4, paragraph: "Paragraph D" },
                { q: 5, paragraph: "Paragraph E" },
                { q: 6, paragraph: "Paragraph F" },
              ],
            },
            {
              type: "sentenceGaps",
              title: "Questions 7-13",
              instructions: [
                "Complete the notes below.",
                "Choose NO MORE THAN TWO WORDS AND/OR A NUMBER from the passage for each answer.",
              ],
              items: [
                { q: 7, text: "In the most recent tests, Finland's top subject was", tail: "." },
                { q: 8, text: "A new school system was needed to improve Finland's", tail: "." },
                { q: 9, text: "Schools followed", tail: " that were created partly by teachers." },
                { q: 10, text: "Young pupils had to study an additional", tail: "." },
                { q: 11, text: "All teachers were given the same", tail: " to use." },
                { q: 12, text: "Teachers had to get a", tail: " but they did not have to pay for this." },
                { q: 13, text: "Applicants were attracted to the", tail: " that teaching received." },
              ],
            },
          ],
        },
        {
          id: "part2",
          passageText: `The Magic of Kefir

A
 The shepherds of the North Caucasus region of Europe were only trying to transport milk the best way they knew how - in leather pouches strapped to the side of donkeys - when they made a significant discovery. A fermentation process would sometimes inadvertently occur en route, and when the pouches were opened up on arrival they would no longer contain milk but rather a pungent, effervescent, low- alcoholic substance instead. This unexpected development was a blessing in disguise. The new drink - which acquired the name kefir - turned out to be health tonic, a naturally-preserved dairy product and a tasty addition to our culinary repertoire.


B
 Although their exact origin remains a mystery, we do know that yeast-based kefir grains have always been at the root of the kefir phenomenon. These grains are capable of a remarkable feat: in contradistinction to most other items you might find in a grocery store, they actually expand and propagate with use. This is because the grains, which are granular to the touch and bear a slight resemblance to cauliflower rosettes, house active cultures that feed on lactose when added to milk. Consequently, a bigger problem for most kefir drinkers is not where to source new kefir grains, but what to do with the ones they already have!


C
 The great thing about kefir is that it does not require a manufacturing line in order to be produced. Grains can be simply thrown in with a batch of milk for ripening to begin. The mixture then requires a cool, dark place to live and grow, with periodic unsettling to prevent clumping (Caucasus inhabitants began storing the concoction in animal-skin satchels on the back of doors - every time someone entered the room the mixture would get lightly shaken). After about 24 hours the yeast cultures in the grains have multiplied and devoured most of the milk sugars, and the final product is then ready for human consumption.


D
 Nothing compares to a person's first encounter with kefir. The smooth, uniform consistency rolls over the tongue in a manner akin to liquefied yogurt. The sharp, tart pungency of unsweetened yogurt is there too, but there is also a slight hint of effervescence, something most users will have previously associated only with mineral waters, soda or beer. Kefir also comes with a subtle aroma of yeast, and depending on the type of milk and ripening conditions, ethanol content can reach up to two or three percent - about on par with a decent lager - although you can expect around 0.8 to one per cent for a typical day-old preparation. This can bring out a tiny edge of alcohol in the kefir's flavour.


E
 Although it has prevailed largely as a fermented milk drink, over the years kefir has acquired a number of other uses. Many bakers use it instead of starter yeast in the preparation of sourdough, and the tangy flavour also makes kefir an ideal buttermilk substitute in pancakes. Kefir also accompanies sour cream as one of the main ingredients in cold beetroot soup and can be used in lieu of regular cow's milk on granola or cereal. As a way to keep their digestive systems fine-tuned, athletes sometimes combine kefir with yoghurt in protein shakes.


F
 Associated for centuries with pictures of Slavic babushkas clutching a shawl in one hand and a cup of kefir in the other, the unassuming beverage has become a minor celebrity of the nascent health food movement in the contemporary West. Every day, more studies pour out supporting the benefits of a diet high in probiotics . This trend toward consuming probiotics has engulfed the leisure classes in these countries to the point that it is poised to become, according to some commentators, "the next multivitamin". These days the word kefir is consequently more likely to bring to mind glamorous, yoga mat-toting women from Los Angeles than austere visions of blustery Eastern Europe.

G
 Kefir's rise in popularity has encouraged producers to take short cuts or alter the production process. Some home users have omitted the ripening and culturation process while commercial dealers often add thickeners, stabilisers and sweeteners. But the beauty of kefir is that, at its healthiest and tastiest, it is a remarkably affordable, uncluttered process, as any accidental invention is bound to be. All that is necessary are some grains, milk and a little bit of patience. A return to the unadulterated kefir-making of old is in everyone's interest.`,
          blocks: [
            {
              type: "headings",
              title: "Questions 14-20",
              instructions: [
                "Reading Passage 2 has seven paragraphs, A-G.",
                "Choose the correct heading for each paragraph from the list of headings below.",
              ],
              listTitle: "List of Headings",
              headings: [
                { value: "i", label: "A unique sensory experience" },
                { value: "ii", label: "Getting back to basics" },
                { value: "iii", label: "The gift that keeps on giving" },
                { value: "iv", label: "Variations in alcohol content" },
                { value: "v", label: "Old methods of transportation" },
                { value: "vi", label: "Culinary applications" },
                { value: "vii", label: "Making kefir" },
                { value: "viii", label: "A fortunate accident" },
                { value: "ix", label: "Kefir gets an image makeover" },
                { value: "x", label: "Ways to improve taste" },
              ],
              questions: [
                { q: 14, paragraph: "Section A" },
                { q: 15, paragraph: "Section B" },
                { q: 16, paragraph: "Section C" },
                { q: 17, paragraph: "Section D" },
                { q: 18, paragraph: "Section E" },
                { q: 19, paragraph: "Section F" },
                { q: 20, paragraph: "Section G" },
              ],
            },
            {
              type: "shortAnswer",
              title: "Questions 21-24",
              instructions: [
                "Answer the questions below using NO MORE THAN TWO WORDS from the passage for each answer.",
              ],
              questions: [
                { q: 21, text: "What do kefir grains look like?" },
                { q: 22, text: "What needs to happen to kefir while it is ripening?" },
                { q: 23, text: "What will the yeast cultures have consumed before kefir is ready to drink?" },
                { q: 24, text: "The texture of kefir in the mouth is similar to what?" },
              ],
            },
            {
              type: "multiTextChoices",
              title: "Questions 25-26",
              instructions: [
                "Choose TWO letters, A-E.",
                "Which TWO products are NOT mentioned as things which kefir can replace?",
              ],
              choices: [
                { letter: "A", text: "Ordinary cow's milk" },
                { letter: "B", text: "Buttermilk" },
                { letter: "C", text: "Sour cream" },
                { letter: "D", text: "Starter yeast" },
                { letter: "E", text: "Yoghurt" },
              ],
              items: [
                { q: 25, text: "Choose one" },
                { q: 26, text: "Choose one" },
              ],
            },
          ],
        },
        {
          id: "part3",
          passageText: `The Swiffer

For a fascinating tale about creativity, look at a cleaning product called the Swiffer and how it came about, urges writer Jonah Lehrer. In the story of the Swiffer, he argues, we have the key elements in producing breakthrough ideas: frustration, moments of insight and sheer hard work. The story starts with a multinational company which had invented products for keeping homes spotless, and couldn't come up with better ways to clean floors, so it hired designers to watch how people cleaned. Frustrated after hundreds of hours of observation, they one day noticed a woman do with a paper towel what people do all the time: wipe something up and throw it away. An idea popped into lead designer Harry West's head: the solution to their problem was a floor mop with a disposable cleaning surface. Mountains of prototypes and years of teamwork later, they unveiled the Swiffer, which quickly became a commercial success.

Lehrer, the author of Imagine, a new book that seeks to explain how creativity works, says this study of the imagination started from a desire to understand what happens in the brain at the moment of sudden insight. 'But the book definitely spiraled out of control,' Lehrer says. 'When you talk to creative people, they'll tell you about the 'eureka'* moment, but when you press them they also talk about the hard work that comes afterwards, so I realised I needed to write about that, too. And then I realised I couldn't just look at creativity from the perspective of the brain, because it's also about the culture and context, about the group and the team and the way we collaborate.'

When it comes to the mysterious process by which inspiration comes into your head as if from nowhere, Lehrer says modern neuroscience has produced a 'first draft' explanation of what is happening in the brain. He writes of how burnt-out American singer Bob Dylan decided to walk away from his musical career in 1965 and escape to a cabin in the woods, only to be overcome by a desire to write. Apparently 'Like a Rolling Stone' suddenly flowed from his pen. 'It's like a ghost is writing a song,' Dylan has reportedly said. 'It gives you the song and it goes away.' But it's no ghost, according to Lehrer.

Instead, the right hemisphere of the brain is assembling connections between past influences and making something entirely new. Neuroscientists have roughly charted this process by mapping the brains of people doing word puzzles solved by making sense of remotely connecting information. For instance, subjects are given three words - such as 'age', 'mile' and 'sand' - and asked to come up with a single word that can precede or follow each of them to form a compound word. (It happens to be 'stone'.) Using brain-imaging equipment, researchers discovered that when people get the answer in an apparent flash of insight, a small fold of tissue called the anterior superior temporal gyrus suddenly lights up just beforehand. This stays silent when the word puzzle is solved through careful analysis. Lehrer says that this area of the brain lights up only after we've hit the wall on a problem. Then the brain starts hunting through the 'filing cabinets of the right hemisphere' to make the connections that produce the right answer.

Studies have demonstrated it's possible to predict a moment of insight up to eight seconds before it arrives. The predictive signal is a steady rhythm of alpha waves emanating from the brain's right hemisphere, which are closely associated with relaxing activities. 'When our minds are at ease-when those alpha waves are rippling through the brain - we're more likely to direct the spotlight of attention towards that stream of remote associations emanating from the right hemisphere,' Lehrer writes. 'In contrast, when we are diligently focused, our attention tends to be towards the details of the problems we are trying to solve.' In other words, then we are less likely to make those vital associations. So, heading out for a walk or lying down are important phases of the creative process, and smart companies know this. Some now have a policy of encouraging staff to take time out during the day and spend time on things that at first glance are unproductive (like playing a PC game), but day-dreaming has been shown to be positively correlated with problem-solving. However, to be more imaginative, says Lehrer, it's also crucial to collaborate with people from a wide range of backgrounds because if colleagues are too socially intimate, creativity is stifled.

Creativity, it seems, thrives on serendipity. American entrepreneur Steve Jobs believed so. Lehrer describes how at Pixar Animation, Jobs designed the entire workplace to maximise the chance of strangers bumping into each other, striking up conversations and learning from one another. He also points to a study of 766 business graduates who had gone on to own their own companies. Those with the greatest diversity of acquaintances enjoyed far more success. Lehrer says he has taken all this on board, and despite his inherent shyness, when he's sitting next to strangers on a plane or at a conference, forces himself to initiate conversations. As for predictions that the rise of the Internet would make the need for shared working space obsolete, Lehrer says research shows the opposite has occurred; when people meet face-to-face, the level of creativity increases. This is why the kind of place we live in is so important to innovation. According to theoretical physicist Geoffrey West, when corporate institutions get bigger, they often become less receptive to change. Cities, however, allow our ingenuity to grow by pulling huge numbers of different people together, who then exchange ideas. Working from the comfort of our homes may be convenient, therefore, but it seems we need the company of others to achieve our finest 'eureka' moments.`,
          blocks: [
            {
              type: "mcq",
              title: "Questions 27-30",
              instructions: [
                "Choose the correct letter, A, B, C or D.",
              ],
              items: [
                { q: 27, text: "What are we told about the product called a 'Swifter'?", choices: { A: "Its designers had little experience working with household objects.", B: "Once the idea for it was conceived, it did not take long to develop.", C: "It achieved profits beyond the manufacturer's expectations.", D: "Its design was inspired by a common housework habit." } },
                { q: 28, text: "When Jonah Lehrer began writing his book,", choices: { A: "he had not intended to focus on creativity.", B: "he ended up revising his plans for the content.", C: "he was working in a highly creative environment.", D: "he was driven by his own experience of the 'eureka' moment." } },
                { q: 29, text: "Lehrer refers to the singer Bob Dylan in order to", choices: { A: "illustrate how ideas seem spontaneous.", B: "exemplify ways in which we might limit our inventiveness.", C: "contrast different approaches to stimulating the imagination.", D: "propose particular approaches to regaining lost creativity." } },
                { q: 30, text: "What did neuroscientists discover from the word puzzle experiment?", choices: { A: "Memories are easier to retrieve when they are more meaningful.", B: "An analytical approach to problem-solving is not necessarily effective.", C: "One part of the brain only becomes active when a connection is made suddenly.", D: "Creative people tend to take a more instinctive approach to solving language problems." } },
              ],
            },
            {
              type: "endingsMatch",
              title: "Questions 31-34",
              instructions: [
                "Complete each sentence with the correct ending, A-G, below.",
              ],
              endings: {
                A: "when people are not too familiar with one another.",
                B: "because there is greater activity in the right side of the brain.",
                C: "if people are concentrating on the specifics of a problem.",
                D: "so they can increase the possibility of finding answers.",
                E: "when people lack the experience required for problem-solving.",
                F: "when the brain shows strong signs of distraction.",
                G: "when both hemispheres of the brain show activity.",
              },
              items: [
                { q: 31, text: "Scientists know a moment of insight is coming" },
                { q: 32, text: "Mental connections are much harder to make" },
                { q: 33, text: "Some companies require their employees to stop working" },
                { q: 34, text: "A team will function more successfully" },
              ],
            },
            {
              type: "sentenceGaps",
              title: "Questions 35-39",
              instructions: [
                "Complete the notes below.",
                "Choose ONE WORD ONLY from the passage for each answer.",
              ],
              items: [
                { q: 35, text: "Steve Jobs: made changes to the", tail: " to encourage interaction at Pixar." },
                { q: 36, text: "Lehrer: company owners must have a wide range of", tail: " to do well." },
                { q: 37, text: "It's important to start", tail: " with new people." },
                { q: 38, text: "The", tail: " has not replaced the need for physical contact." },
                { q: 39, text: "Geoffrey West: living in", tail: " encourages creativity." },
              ],
            },
            {
              type: "mcq",
              title: "Question 40",
              instructions: ["Choose the correct letter, A, B, C or D."],
              items: [
                { q: 40, text: "Which of the following is the most suitable title for Reading Passage 3?", choices: { A: "Understanding what drives our moments of inspiration", B: "Challenging traditional theories of human creativity", C: "Creative solutions for enhancing professional relationships", D: "How the future is shaped by innovative ideas and inspired people" } },
              ],
            },
          ],
        },
      ],
    },
  };

const test6 = {
    listening: {
      audioSrc: "https://audio.ieltsmock.org/test6.mp3",
      html: `
        <div class="listen-page" id="listenSec1">
          <div class="listen-block">
            <div class="listen-h">SECTION 1 - Questions 1-10</div>
            <div class="listen-card">
              <div class="listen-card-title">Part 1: Questions 1-10</div>
              <div class="listen-inst">Complete the form below. Write <b>ONE WORD OR A NUMBER</b> for each answer.</div>
              <div class="listen-card-title">CITY TRANSPORT LOST PROPERTY ENQUIRY</div>
              <div class="listen-notes">
                <div class="note-row">Main item lost: suitcase</div>
                <div class="note-row">Description of main item: black with thin <span class="qnum">1</span> <input data-lq="1" class="l-input"></div>
                <div class="note-row">Other items: a set of <span class="qnum">2</span> <input data-lq="2" class="l-input"> keys</div>
                <div class="note-row">Some documents</div>
                <div class="note-row">A <span class="qnum">3</span> <input data-lq="3" class="l-input"> in a box</div>
                <div class="note-row">A blue <span class="qnum">4</span> <input data-lq="4" class="l-input"></div>
                <div class="note-row">Journey details</div>
                <div class="note-row">Date and time: 2-2.30 pm on <span class="qnum">5</span> <input data-lq="5" class="l-input"></div>
                <div class="note-row">Basic route: caller travelled from the <span class="qnum">6</span> <input data-lq="6" class="l-input"> to Highbury</div>
                <div class="note-row">Mode of travel: caller thinks she left suitcase in a <span class="qnum">7</span> <input data-lq="7" class="l-input"></div>
                <div class="note-row">Personal details</div>
                <div class="note-row">Name: Lisa <span class="qnum">8</span> <input data-lq="8" class="l-input"></div>
                <div class="note-row">Address: 15A <span class="qnum">9</span> <input data-lq="9" class="l-input"> Rd. Highbury</div>
                <div class="note-row">Phone number: <span class="qnum">10</span> <input data-lq="10" class="l-input"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="listen-page hidden" id="listenSec2">
          <div class="listen-block">
            <div class="listen-h">SECTION 2 - Questions 11-20</div>
            <div class="listen-card">
              <div class="listen-card-title">Part 2: Questions 11-15</div>
              <div class="listen-inst">Label the map below. Write the correct letter, <b>A-H</b>, next to Questions 11-15.</div>
              <figure style="margin:0 0 14px; text-align:center;">
                <img src="https://practicepteonline.com/wp-content/uploads/2024/09/lis-test85.png" alt="Listening Test 85 map" style="max-width:100%; height:auto; border-radius:16px; border:1px solid rgba(18,26,36,.08);">
              </figure>
              <div class="listen-notes">
                <div class="note-row"><span class="qnum">11</span> supermarket <input data-lq="11" class="l-input tiny"></div>
                <div class="note-row"><span class="qnum">12</span> climbing supplies store <input data-lq="12" class="l-input tiny"></div>
                <div class="note-row"><span class="qnum">13</span> museum <input data-lq="13" class="l-input tiny"></div>
                <div class="note-row"><span class="qnum">14</span> bike hire <input data-lq="14" class="l-input tiny"></div>
                <div class="note-row"><span class="qnum">15</span> cafe <input data-lq="15" class="l-input tiny"></div>
              </div>
            </div>

            <div class="listen-card">
              <div class="listen-card-title">Questions 16-20</div>
              <div class="listen-inst">What comment does the speaker make about each of the following tracks? Write the correct letter, <b>A, B or C</b>, next to Questions 16-20.</div>
              <div class="optionsBox" style="margin-bottom:14px;">
                <div><b>A</b> It is possible to get lost here.</div>
                <div><b>B</b> It only offers basic accommodation.</div>
                <div><b>C</b> It requires physical strength.</div>
              </div>
              <div class="listen-notes">
                <div class="note-row"><span class="qnum">16</span> North point <input data-lq="16" class="l-input tiny"></div>
                <div class="note-row"><span class="qnum">17</span> Silver river <input data-lq="17" class="l-input tiny"></div>
                <div class="note-row"><span class="qnum">18</span> Valley crossing <input data-lq="18" class="l-input tiny"></div>
                <div class="note-row"><span class="qnum">19</span> Stonebridge <input data-lq="19" class="l-input tiny"></div>
                <div class="note-row"><span class="qnum">20</span> Henderson ridge <input data-lq="20" class="l-input tiny"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="listen-page hidden" id="listenSec3">
          <div class="listen-block">
            <div class="listen-h">SECTION 3 - Questions 21-30</div>
            <div class="listen-card">
              <div class="listen-card-title">Part 3: Questions 21-25</div>
              <div class="listen-inst">Choose the correct letter, <b>A, B or C</b>.</div>

              <div class="mcq">
                <div class="mcq-q"><span class="qnum">21</span> Why has James chosen to do a case study on the company Furniture Rossi?</div>
                <label class="mcq-opt"><input type="radio" name="q21" value="A" data-lq-radio="21"> A) It has enjoyed global success.</label>
                <label class="mcq-opt"><input type="radio" name="q21" value="B" data-lq-radio="21"> B) It is still in a developmental phase.</label>
                <label class="mcq-opt"><input type="radio" name="q21" value="C" data-lq-radio="21"> C) It is an example of a foreign company being rebranded for Australia.</label>
              </div>

              <div class="mcq">
                <div class="mcq-q"><span class="qnum">22</span> According to James, why did Luca Rossi start a furniture company?</div>
                <label class="mcq-opt"><input type="radio" name="q22" value="A" data-lq-radio="22"> A) Furniture-making was already a family occupation.</label>
                <label class="mcq-opt"><input type="radio" name="q22" value="B" data-lq-radio="22"> B) Rossi saw a need for hand-crafted furniture.</label>
                <label class="mcq-opt"><input type="radio" name="q22" value="C" data-lq-radio="22"> C) The work Rossi had done previously was unrewarding.</label>
              </div>

              <div class="mcq">
                <div class="mcq-q"><span class="qnum">23</span> What gave Furniture Rossi a competitive advantage over other furniture companies?</div>
                <label class="mcq-opt"><input type="radio" name="q23" value="A" data-lq-radio="23"> A) its staff</label>
                <label class="mcq-opt"><input type="radio" name="q23" value="B" data-lq-radio="23"> B) its lower prices</label>
                <label class="mcq-opt"><input type="radio" name="q23" value="C" data-lq-radio="23"> C) its locally sourced products</label>
              </div>

              <div class="mcq">
                <div class="mcq-q"><span class="qnum">24</span> What does the tutor recommend James does when writing the second draft of his case study?</div>
                <label class="mcq-opt"><input type="radio" name="q24" value="A" data-lq-radio="24"> A) provide more detailed references</label>
                <label class="mcq-opt"><input type="radio" name="q24" value="B" data-lq-radio="24"> B) check for written accuracy</label>
                <label class="mcq-opt"><input type="radio" name="q24" value="C" data-lq-radio="24"> C) add his own views</label>
              </div>

              <div class="mcq">
                <div class="mcq-q"><span class="qnum">25</span> What do the tutor and James agree was wrong with James' last presentation?</div>
                <label class="mcq-opt"><input type="radio" name="q25" value="A" data-lq-radio="25"> A) It was too short.</label>
                <label class="mcq-opt"><input type="radio" name="q25" value="B" data-lq-radio="25"> B) It focused too much on statistics.</label>
                <label class="mcq-opt"><input type="radio" name="q25" value="C" data-lq-radio="25"> C) There was not enough interaction with the audience.</label>
              </div>
            </div>

            <div class="listen-card">
              <div class="listen-card-title">Questions 26-30</div>
              <div class="listen-inst">Complete the flow chart below. Choose <b>FIVE</b> answers from the list below and write the correct letter, <b>A-G</b>, next to Questions 26-30.</div>
              <div class="optionsBox" style="margin-bottom:14px;">
                <div><b>A</b> website</div>
                <div><b>B</b> locations</div>
                <div><b>C</b> designs</div>
                <div><b>D</b> TV advertising campaigns</div>
                <div><b>E</b> quality</div>
                <div><b>F</b> values</div>
                <div><b>G</b> software programs</div>
              </div>
              <div class="listen-card-title">History of Furniture Rossi</div>
              <div class="listen-notes">
                <div class="note-row">The product <span class="qnum">26</span> <input data-lq="26" class="l-input tiny"> led to a wider customer base</div>
                <div class="note-row">Greater customer demand meant other <span class="qnum">27</span> <input data-lq="27" class="l-input tiny"> were needed</div>
                <div class="note-row">Better <span class="qnum">28</span> <input data-lq="28" class="l-input tiny"> increased overall profitability</div>
                <div class="note-row">Changes to the <span class="qnum">29</span> <input data-lq="29" class="l-input tiny"> were brought on by customer complaints</div>
                <div class="note-row">Furniture Rossi wants to make people more aware of its <span class="qnum">30</span> <input data-lq="30" class="l-input tiny"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="listen-page hidden" id="listenSec4">
          <div class="listen-block">
            <div class="listen-h">SECTION 4 - Questions 31-40</div>
            <div class="listen-card">
              <div class="listen-card-title">Part 4: Questions 31-36</div>
              <div class="listen-inst">Complete the notes below. Write <b>ONE WORD</b> for each answer.</div>
              <div class="listen-card-title">ROCK ART</div>
              <div class="listen-notes">
                <div class="note-row"><b>Why rock art is important to researchers</b></div>
                <div class="note-row">It provides evidence about</div>
                <div class="note-row">- Evolution</div>
                <div class="note-row">- <span class="qnum">31</span> <input data-lq="31" class="l-input"></div>
                <div class="note-row"><b>Global similarities in rock art</b></div>
                <div class="note-row">- Humans often had large <span class="qnum">32</span> <input data-lq="32" class="l-input"></div>
                <div class="note-row">- Animals were common but a <span class="qnum">33</span> <input data-lq="33" class="l-input"> was always drawn from the side or from above.</div>
                <div class="note-row">- Unlikely that contact through <span class="qnum">34</span> <input data-lq="34" class="l-input"> resulted in similar artistic styles</div>
                <div class="note-row"><b>Why our ancestors produced rock art</b></div>
                <div class="note-row">Research suggests rock art was produced</div>
                <div class="note-row">- Firstly for reasons of <span class="qnum">35</span> <input data-lq="35" class="l-input"></div>
                <div class="note-row">- Later for social, spiritual and <span class="qnum">36</span> <input data-lq="36" class="l-input"> reasons.</div>
              </div>
            </div>

            <div class="listen-card">
              <div class="listen-card-title">Questions 37-40</div>
              <div class="listen-inst">Answer the questions below. Write <b>ONE WORD ONLY</b> for each answer.</div>
              <div class="listen-notes">
                <div class="note-row">What <b>TWO</b> images drawn by Aboriginal people show their contact with Europeans?</div>
                <div class="note-row">- <span class="qnum">37</span> <input data-lq="37" class="l-input"></div>
                <div class="note-row">- <span class="qnum">38</span> <input data-lq="38" class="l-input"></div>
                <div class="note-row">Which human activities does the lecturer say are the main threats to Aboriginal rock art?</div>
                <div class="note-row">- <span class="qnum">39</span> <input data-lq="39" class="l-input"></div>
                <div class="note-row">- Vandalism</div>
                <div class="note-row">- <span class="qnum">40</span> <input data-lq="40" class="l-input"></div>
              </div>
            </div>
          </div>
        </div>
      `,
    },

    writing: {
      task1Type: "Bar chart",
      task2Type: "Opinion essay",
      task1Html: `
        You should spend about 20 minutes on this task.<br>
        The chart below shows the results of a survey about people's coffee and tea buying and drinking habits in five Australian cities.<br>
        Summarize the information by selecting and reporting the main features, and make comparisons where relevant.<br>
        <b>Write at least 150 words.</b>
      `,
      task1ImageSrc: "https://audio.ieltsmock.org/6d9e77_63784bff2bde488187bf58a248408c64~mv2.avif",
      task2Html: `
        You should spend about 40 minutes on this task.<br><br>
        Nowadays, children spend a lot of time watching TV and playing computer games. Some people believe this has negative effects on children’s mental abilities.<br>
        <b>To what extent do you agree or disagree?</b><br>
        Give reasons for your answer and include any relevant examples from your own knowledge or experience.<br>
        <b>Write at least 250 words.</b>
      `,
    },

    reading: {
      parts: [
        {
          id: "part1",
          passageText: `Trees in trouble

A Big trees are incredibly important ecologically. For a start, they sustain countless other species. They provide shelter for many animals, and their trunks and branches can become gardens, hung with green ferns, orchids and bromeliads, coated with mosses and draped with vines. With their tall canopies basking in the sun, they capture vast amounts of energy. This allows them to produce massive crops of fruit, flowers and foliage that sustain much of the animal life in the forest.

B Only a small number of tree species have the genetic capacity to grow really big. The mightiest are native to North America, but big trees grow all over the globe, from the tropics to the boreal forests of the high latitudes. To achieve giant stature, a tree needs three things: the right place to establish its seedling, good growing conditions and lots of time with low adult mortality. Disrupt any of these, and you can lose your biggest trees.

C In some parts of the world, populations of big trees are dwindling because their seedlings cannot survive or grow. In southern India, for instance, an aggressive non-native shrub, Lantana camara, is invading the floor of many forests. Lantana grows so thickly that young trees often fail to take root. With no young trees to replace them, it is only a matter of time before most of the big trees disappear. Across much of northern Australia, gamba grass from Africa is overrunning native savannah woodlands. The grass grows up to four metres tall and burns fiercely, creating super-hot fires that cause catastrophic tree mortality.

D Without the right growing conditions trees cannot get really big, and there is some evidence to suggest tree growth could slow in a warmer world, particularly in environments that are already warm. Having worked for decades at La Selva Biological Station in Puerto Viejo de Sarapiqui, Costa Rica, David and Deborah Clark and colleagues have shown that tree growth there declines markedly in warmer years. During the day, their photosynthesis shuts down when it gets too warm, and at night they consume more energy because their metabolic rate increases. With less energy produced in warmer years and more being consumed just to survive, there is even less energy available for growth.

E The Clarks' hypothesis, if correct, means tropical forests would shrink over time. The largest, oldest trees would progressively die off and tend not to be replaced. According to the Clarks, this might trigger a destabilisation of the climate; as older trees die, forests would release some of their stored carbon into the atmosphere, prompting a vicious cycle of further warming, forest shrinkage and carbon emissions.

F Big trees face threats from elsewhere. The most serious is increasing mortality, especially of mature trees. Across much of the planet, forests of slow-growing ancient trees have been cleared for human use. In western North America, most have been replaced by monocultures of fast-growing conifers. Siberia's forests are being logged at an incredible rate. Logging in tropical forests is selective but the timber cutters usually prioritise the biggest and oldest trees. In the Amazon, researchers found the mortality rate for the biggest trees had tripled in small patches of rainforest surrounded by pasture land. When winds blow across the surrounding cleared land, there is nothing to stop their acceleration. When they hit the trees, the impact can snap them in half. Rainforest fragments also dry out when surrounded by hot pastures and the resulting drought can have devastating consequences.

G Particular enemies to large trees are insects and disease. Across vast areas of western North America, increasingly mild winters are causing massive outbreaks of bark beetle. These tiny creatures can kill entire forests as they tunnel their way through the inside of trees. In both North America and Europe, fungus-causing diseases such as Dutch elm disease have killed off millions of stately trees that once gave beauty to forests and cities. As a result of human activity, such enemies reach even the remotest corners of the world, threatening to make the ancient giants a thing of the past.`,
          blocks: [
            {
              type: "headings",
              title: "Questions 1-7",
              instructions: [
                "Reading Passage 1 has seven paragraphs, A-G.",
                "Choose the correct heading for each paragraph from the list of headings below.",
                "Write the correct number, i-x, for each answer.",
              ],
              listTitle: "List of Headings",
              headings: [
                { value: "i", label: "How deforestation harms isolated trees" },
                { value: "ii", label: "How other plants can cause harm" },
                { value: "iii", label: "Which big trees support the most diverse species" },
                { value: "iv", label: "Impact of big tree loss on the wider environment" },
                { value: "v", label: "Measures to prevent further decline in big tree populations" },
                { value: "vi", label: "How wildlife benefits from big trees" },
                { value: "vii", label: "Risk from pests and infection" },
                { value: "viii", label: "Ways in which industry uses big tree products" },
                { value: "ix", label: "How higher temperatures slow the rate of tree growth" },
                { value: "x", label: "Factors that enable trees to grow to significant heights" },
              ],
              questions: [
                { q: 1, paragraph: "Paragraph A" },
                { q: 2, paragraph: "Paragraph B" },
                { q: 3, paragraph: "Paragraph C" },
                { q: 4, paragraph: "Paragraph D" },
                { q: 5, paragraph: "Paragraph E" },
                { q: 6, paragraph: "Paragraph F" },
                { q: 7, paragraph: "Paragraph G" },
              ],
            },
            {
              type: "sentenceGaps",
              title: "Questions 8-13",
              instructions: [
                "Complete the sentences below.",
                "Choose NO MORE THAN TWO WORDS from the passage for each answer.",
              ],
              items: [
                { q: 8, text: "The biggest trees in the world can be found in", tail: "." },
                { q: 9, text: "Some trees in northern Australia die because of", tail: " made worse by gamba grass." },
                { q: 10, text: "The Clarks believe that the release of", tail: " from dead trees could lead to the death of more trees." },
                { q: 11, text: "Strong", tail: " are capable of damaging tall trees in the Amazon." },
                { q: 12, text: "", leadingBlank: true, text2: "has a worse impact on tall trees than smaller ones." },
                { q: 13, text: "In western North America, a species of", tail: " has destroyed many trees." },
              ],
            },
          ],
        },
        {
          id: "part2",
          passageText: `Whale Strandings

When the last stranded whale of a group eventually dies, the story does not end there. A team of researchers begins to investigate, collecting skin samples for instance, recording anything that could help them answer the crucial question: why? Theories abound, some more convincing than others. In recent years, navy sonar has been accused of causing certain whales to strand. It is known that noise pollution from offshore industry, shipping and sonar can impair underwater communication, but can it really drive whales onto our beaches?

In 1998, researchers at the Pelagos Cetacean Research Institute, a Greek non-profit scientific group, linked whale strandings with low-frequency sonar tests being carried out by the North Atlantic Treaty Organisation (NATO). They recorded the stranding of 12 Cuvier's beaked whales over 38.2 kilometres of coastline. NATO later admitted it had been testing new sonar technology in the same area at the time as the strandings had occurred. Mass whale strandings involve four or more animals. Typically they all wash ashore together, but in mass atypical strandings, the whales do not strand as a group; they are scattered over a larger area.

For humans, hearing a sudden loud noise might prove frightening, but it does not induce mass fatality. For whales, on the other hand, there is a theory on how sonar can kill. The noise can surprise the animal, causing it to swim too quickly to the surface. The result is decompression sickness, a hazard human divers know all too well. If a diver ascends too quickly from a high-pressure underwater environment to a lower-pressure one, gases dissolved in blood and tissue expand and form bubbles. The bubbles block the flow of blood to vital organs, and can ultimately lead to death.

Plausible as this seems, it is still a theory and based on our more comprehensive knowledge of land-based animals. For this reason, some scientists are wary. Whale expert Karen Evans is one such scientist. Another is Rosemary Gales, a leading expert on whale strandings. She says sonar technology cannot always be blamed for mass strandings. It is a case-by-case situation. Whales have been stranding for a very long time - pre-sonar. And when 80% of all Australian whale strandings occur around Tasmania, Gales and her team must continue in the search for answers.

When animals beach next to each other at the same time, the most common cause has nothing to do with humans at all. They are highly social creatures. When they mass strand, it is complete panic and chaos. If one of the group strands and sounds the alarm, others will try to swim to its aid, and become stuck themselves.

Activities such as sonar testing can hint at when a stranding may occur, but if conservationists are to reduce the number of strandings, or improve rescue operations, they need information on where strandings are likely to occur as well. With this in mind, Ralph James, physicist at the University of Western Australia in Perth, thinks he may have discovered why whales turn up only on some beaches. In 1986 he went to Augusta, Western Australia, where more than 100 false killer whales had beached. He found out from chatting to the locals that whales had been stranding there for decades. So he asked himself, what is it about this beach?

Data has since revealed that all mass strandings around Australia occur on gently sloping sandy beaches, some with inclines of less than 0.5%. For whale species that depend on an echolocation system to navigate, this kind of beach spells disaster. Usually, as they swim, they make clicking noises, and the resulting sound waves are reflected in an echo and travel back to them. However, these just fade out on shallow beaches, so the whale does not hear an echo and it crashes onto the shore.

But that is not all. Physics, it appears, can help with the when as well as the where. The ocean is full of bubbles. Larger ones rise quickly to the surface and disappear, whilst smaller ones - called microbubbles - can last for days. It is these that absorb whale clicks. Rough weather generates more bubbles than usual. So, during and after a storm, echolocating whales are essentially swimming blind.

Last year was a bad one for strandings in Australia. Can we predict if this - or any other year - will be any better? Some scientists believe we can. They have found trends which could be used to forecast bad years for strandings in the future. In 2005, a survey by Klaus Vanselow and Klaus Ricklefs of sperm whale strandings in the North Sea even found a correlation between these and the sunspot cycle, and suggested that changes in the Earth's magnetic field might be involved. But others are sceptical. In the same year, Karen Evans co-authored a study on Australian strandings that uncovered a completely different trend. In years when strong westerly and southerly winds bring cool water rich in nutrients closer to the Australian coast, there is an increase in the number of fish. The whales follow.

So what causes mass strandings? It is probably many different components. And that is probably right. But the point is we now know what many of those components are.`,
          blocks: [
            {
              type: "shortAnswer",
              title: "Questions 14-17",
              instructions: [
                "Choose NO MORE THAN TWO WORDS from the passage for each answer.",
              ],
              questions: [
                { q: 14, text: "What do researchers often take from the bodies of whales?" },
                { q: 15, text: "What do some industries and shipping create that is harmful to whales?" },
                { q: 16, text: "In which geographical region do most whale strandings in Australia happen?" },
                { q: 17, text: "Which kind of whale was the subject of a study in the North Sea?" },
              ],
            },
            {
              type: "sentenceGaps",
              title: "Questions 18-21",
              instructions: [
                "Label the diagram below.",
                "Choose NO MORE THAN TWO WORDS from the passage for each answer.",
                "Write your answers in boxes 18-21 on your answer sheet.",
              ],
              items: [
                { q: 18, text: "Because", tail: " disappear on shallow beaches, whales don't realise the beach is near." },
                { q: 19, text: "Extra", tail: " in the water attract fish and therefore whales to South Australian coasts." },
                { q: 20, text: "Storms create", tail: " which absorb whales' clicks." },
                { q: 21, text: "Sonar may result in a blocked supply of", tail: " in whale bodies." },
              ],
            },
            {
              type: "tfng",
              title: "Questions 22-26",
              instructions: [
                "Do the following statements agree with the information given in Reading Passage 2?",
                "Write TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, or NOT GIVEN if there is no information on this.",
              ],
              items: [
                { q: 22, text: "The aim of the research by the Pelagos Institute in 1998 was to prove that navy sonar was responsible for whale strandings." },
                { q: 23, text: "The whales stranded in Greece were found at different points along the coast." },
                { q: 24, text: "Rosemary Gales has questioned the research techniques used by the Greek scientists." },
                { q: 25, text: "According to Gales, whales are likely to try to help another whale in trouble." },
                { q: 26, text: "There is now agreement amongst scientists that changes in the Earth's magnetic fields contribute to whale strandings." },
              ],
            },
          ],
        },
        {
          id: "part3",
          passageText: `Science in Space

A premier, world-class laboratory in low Earth orbit. That was how the National Aeronautics and Space Administration agency (NASA) sold the International Space Station (ISS) to the US Congress in 2001. Today no one can doubt the agency's technological ambition. The most complex engineering project ever attempted has created an enormous set of interlinked modules that orbits the planet at more than 27,000 kilometres per hour. It might be travelling fast but, say critics, as a lab it is going nowhere. So far, it has gone through 150 billion dollars.

So where should its future priorities lie? This question was addressed at the recent first annual ISS research and development conference in Colorado. Among the presenters was Satoshi Iwase of Aichi Medical University in Japan who has spent several years developing an experiment that could help solve one of the key problems that humans will face in space: keeping our bodies healthy in weightlessness. One thing that physiologists have learned is that without gravity our bodies begin to lose strength, leaving astronauts with weakened bones, muscles and cardiovascular systems. To counter these effects on a long-duration mission to Mars, astronauts will almost certainly need to create their own artificial gravity. This is where Iwase comes in. He leads a team designing a centrifuge for humans. In their preliminary design, an astronaut is strapped into the seat of a machine that resembles an exercise bike. Pedalling provides a workout for the astronaut's muscles and cardiovascular system, but it also causes the seat to rotate vertically around a central axis so the rider experiences artificial gravity while exercising.

The centrifuge project highlights the station's potential as a research lab. Similar machines have flown in space aboard NASA's shuttles, but they could not be tested for long enough to prove whether they were effective. It has been calculated that to properly assess a centrifuge's impact on human physiology, astronauts would have to ride it for 30 minutes a day for at least two months. The only way to test this is in weightlessness, and the only time we have to do that is on the space station, says Laurence Young, a space medicine expert at the Massachusetts Institute of Technology.

There are certainly plenty of ideas for other experiments, but many projects have yet to fly. Even if the centrifuge project gets the green light, it will have to wait another five years before the station's crew can take a spin. Lengthy delays like this are one of the key challenges for NASA, according to an April 2011 report from the US National Academy of Sciences. Its authors said they were deeply concerned about the state of NASA's science research, and made a number of recommendations. Besides suggesting that the agency reduces the time between approving experiments and sending them into space, it also recommended setting clearer research priorities.

NASA has already begun to take action, hiring management consultants ProOrbis to develop a plan to cut through the bureaucracy. And Congress also directed NASA to hire an independent organisation, the Centre for the Advancement of Science in Space (CASIS), to help manage the station's US lab facilities. One of CASIS's roles is to convince public and private investors that science on the station is worth the spend because judged solely by the number of papers published, the ISS certainly seems poor value: research on the station has generated about 3,100 papers since 1998. The Hubble Space Telescope, meanwhile, has produced more than 11,300 papers in just over 20 years, yet it cost less than one-tenth of the price of the space station.

Yet Mark Uhran, assistant associate administrator for the ISS, refutes the criticism that the station has not done any useful research. He points to progress made on a salmonella vaccine, for example. To get the ISS research back on track, CASIS has examined more than 100 previous microgravity experiments to identify promising research themes. From this, it has opted to focus on life science and medical research, and recently called for proposals for experiments on muscle wasting, osteoporosis and the immune system. The organisation also maintains that the ISS should be used to develop products with commercial application and to test those that are either close to or already on the market. Investment from outside organisations is vital, and a balance between academic and commercial research will help attract this.

The station needs to attract cutting-edge research, yet many scientists seem to have little idea what goes on aboard it. Jeanne DiFrancesco at ProOrbis conducted more than 200 interviews with people from organisations with potential interests in low-gravity studies. Some were aware of the ISS but they did not know what is going on up there. Others know there is science, but they do not know what kind.

According to Alan Stern, planetary scientist, the biggest public relations boost for the ISS may come from the privately funded space flight industry. Companies like SpaceX could help NASA and its partners when it comes to resupplying the ISS, as it suggests it can reduce launch costs by two-thirds. Virgin Atlantic's Space Ship Two or ZeroUnfinity's high-altitude balloon could also boost the space station's fortunes. They might not come close to the ISS's orbit, yet Stern believes they will revolutionise the way the public sees space. Scientists are already queuing for seats on these low-gravity space-flight services so they can collect data during a few minutes of weightlessness. This demand for low-cost space flight could eventually lead to a service running on a more frequent basis, giving researchers the chance to test their ideas before submitting a proposal for experiments on the ISS. Getting flight experience should help them win a slot on the station, says Stern.`,
          blocks: [
            {
              type: "mcq",
              title: "Questions 27-30",
              instructions: ["Choose the correct letter, A, B, C or D."],
              items: [
                {
                  q: 27,
                  text: "What does the writer state about the ISS in the first paragraph?",
                  choices: {
                    A: "Its manufacture has remained within the proposed budget.",
                    B: "It is a great example of technological achievement.",
                    C: "There are doubts about the speed it has attained.",
                    D: "NASA should have described its purpose more accurately.",
                  },
                },
                {
                  q: 28,
                  text: "What are we told about Satoshi Iwase's experimental machine?",
                  choices: {
                    A: "It is based on conventional exercise equipment.",
                    B: "It was originally commissioned by NASA.",
                    C: "It is designed only to work in low-gravity environments.",
                    D: "It has benefits that Iwase did not anticipate.",
                  },
                },
                {
                  q: 29,
                  text: "The writer refers to the Hubble Space Telescope in order to",
                  choices: {
                    A: "show why investment in space technology has decreased.",
                    B: "highlight the need to promote the ISS in a positive way.",
                    C: "explain which kind of projects are more likely to receive funding.",
                    D: "justify the time required for a space project to produce results.",
                  },
                },
                {
                  q: 30,
                  text: "In the sixth paragraph, we are told that CASIS has",
                  choices: {
                    A: "rejected certain applications for experiments on the ISS.",
                    B: "expressed concern about testing products used for profit.",
                    C: "questioned the benefits of some of the projects currently on the ISS.",
                    D: "invited researchers to suggest certain health-based projects.",
                  },
                },
              ],
            },
            {
              type: "endingsMatch",
              title: "Questions 31-35",
              instructions: [
                "Look at the following opinions and the list of people below.",
                "Match each opinion with the correct person, A, B, C or D.",
                "You may use any letter more than once.",
              ],
              endings: {
                A: "Laurence Young",
                B: "Authors of the US National Academy of Sciences report",
                C: "Mark Uhran",
                D: "Jeanne DiFrancesco",
              },
              items: [
                { q: 31, text: "The ISS should be available for business-related ventures." },
                { q: 32, text: "There is general ignorance about what kinds of projects are possible on the ISS." },
                { q: 33, text: "The process of getting accepted projects onto the ISS should be speeded up." },
                { q: 34, text: "Some achievements of the ISS are underrated." },
                { q: 35, text: "To properly assess new space technology, there has to be an absence of gravity." },
              ],
            },
            {
              type: "summarySelect",
              title: "Questions 36-39",
              instructions: [
                "Complete the summary using the list of words, A-H, below.",
                "Write the correct letter, A-H, for each answer.",
              ],
              summaryTitle: "The influence of commercial space flight on the ISS",
              summaryLines: [
                { blankQ: 36, text: "According to Alan Stern, private space companies could affect the future of the ISS because sending food and equipment there would be more", tail: " if a commercial craft were used." },
                { blankQ: 37, text: "Commercial flights might make the whole idea of space exploration seem", tail: " to ordinary people." },
                { blankQ: 38, text: "As demand for space flights increases, there is a chance of them becoming more", tail: "." },
                { blankQ: 39, text: "By working on a commercial flight first, scientists would be more", tail: " if an ISS position came up." },
              ],
              optionsTitle: "Options",
              options: [
                { letter: "A", word: "safe" },
                { letter: "B", word: "competitive" },
                { letter: "C", word: "flexible" },
                { letter: "D", word: "real" },
                { letter: "E", word: "rapid" },
                { letter: "F", word: "regular" },
                { letter: "G", word: "suitable" },
                { letter: "H", word: "economical" },
              ],
            },
            {
              type: "mcq",
              title: "Question 40",
              instructions: ["Choose the correct letter, A, B, C or D."],
              items: [
                {
                  q: 40,
                  text: "The writer's purpose in writing this article is to",
                  choices: {
                    A: "promote the advantages of space flight in general.",
                    B: "illustrate how the ISS could become more effective.",
                    C: "criticise the ISS for its narrow-minded attitude.",
                    D: "contrast useful and worthless space projects.",
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  };

const test7 = {
    listening: {
      audioSrc: "https://audio.ieltsmock.org/Test%207.mp3",
      html: `
        <div class="listen-page" id="listenSec1">
          <div class="listen-block">
            <div class="listen-h">SECTION 1 - Questions 1-10</div>
            <div class="listen-card">
              <div class="listen-card-title">Part 1: Questions 1-6</div>
              <div class="listen-inst">Complete the table below. Write <b>NO MORE THAN ONE WORD OR A NUMBER</b>.</div>
              <div class="listen-card-title">Community Centre Evening Classes</div>
              <div class="listen-notes">
                <div class="note-row">Painting with watercolors: in the hall, at <span class="qnum">1</span> <input data-lq="1" class="l-input tiny"> pm on Tuesdays, bring a water jar and set of <span class="qnum">2</span> <input data-lq="2" class="l-input">, cost £45 for 4 classes.</div>
                <div class="note-row">Maori language: in the small room at the <span class="qnum">3</span> <input data-lq="3" class="l-input tiny"> of the building, starts in <span class="qnum">4</span> <input data-lq="4" class="l-input">, bring a small decoder, cost £40 for 5 classes.</div>
                <div class="note-row">Digital photography: room 9, 6 pm Wednesday evenings, bring the <span class="qnum">5</span> <input data-lq="5" class="l-input"> for the camera, cost £<span class="qnum">6</span> <input data-lq="6" class="l-input tiny"> for 8 classes.</div>
              </div>
            </div>

            <div class="listen-card">
              <div class="listen-card-title">Questions 7-10</div>
              <div class="listen-inst">Complete the sentences below. Write <b>ONE WORD ONLY</b> for each answer.</div>
              <div class="listen-notes">
                <div class="note-row"><span class="qnum">7</span> The watercolours class suits people who are <input data-lq="7" class="l-input"></div>
                <div class="note-row"><span class="qnum">8</span> To find out about the Maori language class, contact Jason <input data-lq="8" class="l-input"></div>
                <div class="note-row"><span class="qnum">9</span> For the photography class, check the <input data-lq="9" class="l-input"> for the camera.</div>
                <div class="note-row"><span class="qnum">10</span> There is a trip to a local <input data-lq="10" class="l-input"> in the final week of the photography class.</div>
              </div>
            </div>
          </div>
        </div>

        <div class="listen-page hidden" id="listenSec2">
          <div class="listen-block">
            <div class="listen-h">SECTION 2 - Questions 11-20</div>
            <div class="listen-card">
              <div class="listen-card-title">Part 2: Questions 11 and 12</div>
              <div class="listen-inst">Choose <b>TWO</b> letters, <b>A-E</b>.</div>
              <div class="mcq-q">Which <b>TWO</b> tasks will the volunteers in group A be responsible for?</div>
              <label class="mcq-opt" for="t7q11a"><input id="t7q11a" name="t7q11group" type="checkbox" data-lq-check="11" value="A" autocomplete="off"> A) widening pathways</label>
              <label class="mcq-opt" for="t7q11b"><input id="t7q11b" name="t7q11group" type="checkbox" data-lq-check="11" value="B" autocomplete="off"> B) planting trees</label>
              <label class="mcq-opt" for="t7q11c"><input id="t7q11c" name="t7q11group" type="checkbox" data-lq-check="11" value="C" autocomplete="off"> C) picking up rubbish</label>
              <label class="mcq-opt" for="t7q11d"><input id="t7q11d" name="t7q11group" type="checkbox" data-lq-check="11" value="D" autocomplete="off"> D) putting up signs</label>
              <label class="mcq-opt" for="t7q11e"><input id="t7q11e" name="t7q11group" type="checkbox" data-lq-check="11" value="E" autocomplete="off"> E) building fences</label>
            </div>

            <div class="listen-card">
              <div class="listen-card-title">Questions 13 and 14</div>
              <div class="listen-inst">Choose <b>TWO</b> letters, <b>A-E</b>.</div>
              <div class="mcq-q">Which <b>TWO</b> items should volunteers in group A bring with them?</div>
              <label class="mcq-opt" for="t7q13a"><input id="t7q13a" name="t7q13group" type="checkbox" data-lq-check="13" value="A" autocomplete="off"> A) food and water</label>
              <label class="mcq-opt" for="t7q13b"><input id="t7q13b" name="t7q13group" type="checkbox" data-lq-check="13" value="B" autocomplete="off"> B) boots</label>
              <label class="mcq-opt" for="t7q13c"><input id="t7q13c" name="t7q13group" type="checkbox" data-lq-check="13" value="C" autocomplete="off"> C) gloves</label>
              <label class="mcq-opt" for="t7q13d"><input id="t7q13d" name="t7q13group" type="checkbox" data-lq-check="13" value="D" autocomplete="off"> D) raincoats</label>
              <label class="mcq-opt" for="t7q13e"><input id="t7q13e" name="t7q13group" type="checkbox" data-lq-check="13" value="E" autocomplete="off"> E) their own tools</label>
            </div>

            <div class="listen-card">
              <div class="listen-card-title">Questions 15-20</div>
              <div class="listen-inst">Label the plan below. Write the correct letter <b>A-I</b> next to Questions 15-20.</div>
              <figure style="margin:0 0 14px; text-align:center;">
                <img src="https://practicepteonline.com/wp-content/uploads/2024/09/lis-test84.png" alt="Listening Test 84 plan" style="max-width:100%; height:auto; border-radius:16px; border:1px solid rgba(18,26,36,.08);">
              </figure>
              <div class="listen-notes">
                <div class="note-row"><span class="qnum">15</span> Vegetable beds <input data-lq="15" class="l-input tiny"></div>
                <div class="note-row"><span class="qnum">16</span> Bee hives <input data-lq="16" class="l-input tiny"></div>
                <div class="note-row"><span class="qnum">17</span> Seating <input data-lq="17" class="l-input tiny"></div>
                <div class="note-row"><span class="qnum">18</span> Adventure playground <input data-lq="18" class="l-input tiny"></div>
                <div class="note-row"><span class="qnum">19</span> Sand area <input data-lq="19" class="l-input tiny"></div>
                <div class="note-row"><span class="qnum">20</span> Pond <input data-lq="20" class="l-input tiny"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="listen-page hidden" id="listenSec3">
          <div class="listen-block">
            <div class="listen-h">SECTION 3 - Questions 21-30</div>
            <div class="listen-card">
              <div class="listen-card-title">Part 3: Questions 21-25</div>
              <div class="listen-inst">Choose the correct letter, <b>A, B or C</b>.</div>
              <div class="listen-card-title">Food Waste</div>

              <div class="mcq">
                <div class="mcq-q"><span class="qnum">21</span> What point does Robert make about the 2013 study in Britain?</div>
                <label class="mcq-opt"><input type="radio" name="q21" value="A" data-lq-radio="21"> A) It focused more on packaging than wasted food.</label>
                <label class="mcq-opt"><input type="radio" name="q21" value="B" data-lq-radio="21"> B) It proved that households produced more waste than restaurants.</label>
                <label class="mcq-opt"><input type="radio" name="q21" value="C" data-lq-radio="21"> C) It included liquid waste as well as solid waste.</label>
              </div>

              <div class="mcq">
                <div class="mcq-q"><span class="qnum">22</span> The speakers agree that food waste reports should emphasise the connection between carbon dioxide emissions and</div>
                <label class="mcq-opt"><input type="radio" name="q22" value="A" data-lq-radio="22"> A) food production.</label>
                <label class="mcq-opt"><input type="radio" name="q22" value="B" data-lq-radio="22"> B) transport of food to landfill sites.</label>
                <label class="mcq-opt"><input type="radio" name="q22" value="C" data-lq-radio="22"> C) distribution of food products.</label>
              </div>

              <div class="mcq">
                <div class="mcq-q"><span class="qnum">23</span> Television programmes now tend to focus on</div>
                <label class="mcq-opt"><input type="radio" name="q23" value="A" data-lq-radio="23"> A) the nutritional value of food products.</label>
                <label class="mcq-opt"><input type="radio" name="q23" value="B" data-lq-radio="23"> B) the origin of food products.</label>
                <label class="mcq-opt"><input type="radio" name="q23" value="C" data-lq-radio="23"> C) the chemicals found in food products.</label>
              </div>

              <div class="mcq">
                <div class="mcq-q"><span class="qnum">24</span> For Anna, the most significant point about food waste is</div>
                <label class="mcq-opt"><input type="radio" name="q24" value="A" data-lq-radio="24"> A) the moral aspect.</label>
                <label class="mcq-opt"><input type="radio" name="q24" value="B" data-lq-radio="24"> B) the environmental impact.</label>
                <label class="mcq-opt"><input type="radio" name="q24" value="C" data-lq-radio="24"> C) the economic effect.</label>
              </div>

              <div class="mcq">
                <div class="mcq-q"><span class="qnum">25</span> Anna and Robert decide to begin their presentation by</div>
                <label class="mcq-opt"><input type="radio" name="q25" value="A" data-lq-radio="25"> A) handing out a questionnaire.</label>
                <label class="mcq-opt"><input type="radio" name="q25" value="B" data-lq-radio="25"> B) providing statistical evidence.</label>
                <label class="mcq-opt"><input type="radio" name="q25" value="C" data-lq-radio="25"> C) showing images of wasted food.</label>
              </div>
            </div>

            <div class="listen-card">
              <div class="listen-card-title">Questions 26-30</div>
              <div class="listen-inst">What advantage do the speakers identify for each of the following projects? Choose <b>FIVE</b> answers from the box and write the correct letter, <b>A-G</b>, next to Questions 26-30.</div>
              <div class="optionsBox" style="margin-bottom:14px;">
                <div><b>A</b> it should save time</div>
                <div><b>B</b> it will create new jobs</div>
                <div><b>C</b> it will benefit local communities</div>
                <div><b>D</b> it will make money</div>
                <div><b>E</b> it will encourage personal responsibility</div>
                <div><b>F</b> it will be easy to advertise</div>
                <div><b>G</b> it will involve very little cost</div>
              </div>
              <div class="listen-notes">
                <div class="note-row"><span class="qnum">26</span> edible patch <input data-lq="26" class="l-input tiny"></div>
                <div class="note-row"><span class="qnum">27</span> ripeness centre <input data-lq="27" class="l-input tiny"></div>
                <div class="note-row"><span class="qnum">28</span> waste tracking technology <input data-lq="28" class="l-input tiny"></div>
                <div class="note-row"><span class="qnum">29</span> smartphone application <input data-lq="29" class="l-input tiny"></div>
                <div class="note-row"><span class="qnum">30</span> food waste composting <input data-lq="30" class="l-input tiny"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="listen-page hidden" id="listenSec4">
          <div class="listen-block">
            <div class="listen-h">SECTION 4 - Questions 31-40</div>
            <div class="listen-card">
              <div class="listen-card-title">Part 4: Questions 31-40</div>
              <div class="listen-inst">Complete the notes below. Write <b>ONE WORD</b> for each answer.</div>
              <div class="listen-card-title">Kite making by the Maori people of New Zealand</div>
              <div class="listen-notes">
                <div class="note-row"><b>Making and appearance of kites</b></div>
                <div class="note-row">The priests who made the kites had rules for size and scale.</div>
                <div class="note-row"><span class="qnum">31</span> <input data-lq="31" class="l-input"> was not allowed during a kite's preparation.</div>
                <div class="note-row">Kites often represented a god, a bird or a <span class="qnum">32</span> <input data-lq="32" class="l-input"></div>
                <div class="note-row">Frames were decorated with grasses and <span class="qnum">33</span> <input data-lq="33" class="l-input"></div>
                <div class="note-row">A line of noisy <span class="qnum">34</span> <input data-lq="34" class="l-input"> was attached to them.</div>
                <div class="note-row">They could be triangular, rectangular or <span class="qnum">35</span> <input data-lq="35" class="l-input"> shaped.</div>
                <div class="note-row">Patterns were made from clay mixed with <span class="qnum">36</span> <input data-lq="36" class="l-input"> oil.</div>
                <div class="note-row">Some had human head masks with <span class="qnum">37</span> <input data-lq="37" class="l-input"> and a tattoo.</div>
                <div class="note-row"><b>Purpose and function of kites</b></div>
                <div class="note-row">A way of sending <span class="qnum">38</span> <input data-lq="38" class="l-input"> to the gods.</div>
                <div class="note-row">A way of telling other villages that a <span class="qnum">39</span> <input data-lq="39" class="l-input"> was necessary.</div>
                <div class="note-row">A means of <span class="qnum">40</span> <input data-lq="40" class="l-input"> if enemies were coming.</div>
              </div>
            </div>
          </div>
        </div>
      `,
    },

    writing: {
      task1Type: "Bar chart",
      task2Type: "Problem and solution",
      task1Html: `
        You should spend about 20 minutes on this task.<br>
        The charts below show the performance of a bus company in terms of punctuality, both actual and target (what actually happened compared to what the company was trying to achieve), and the number of complaints and passengers.<br>
        Summarize the information by selecting and reporting the main features, and make comparisons where relevant.<br>
        <b>Write at least 150 words.</b>
      `,
      task1ImageSrc: "https://audio.ieltsmock.org/9c02b61c-1be1-44e9-bbe1-fe42013c0032.png",
      task2Html: `
        You should spend about 40 minutes on this task.<br><br>
        In many countries today, major cities have become too big and overcrowded.<br>
        <b>Why is this? What measures could be taken to reduce this problem?</b><br>
        Give reasons for your answer and include any relevant examples from your own knowledge or experience.<br>
        <b>Write at least 250 words.</b>
      `,
    },

    reading: {
      parts: [
        {
          id: "part1",
          passageText: `South pole adventurer

FOR a few weeks in January 1912, Antarctica was full of explorers. Norwegian Roald Amundsen had reached the South Pole on 14 December and was speeding back to the coast. On 17 January, Robert Scott and the men of the British Antarctic expedition had arrived at the pole to find they had been beaten to it. Just then, a third man arrived; Japanese explorer Nobu Shirase. However, his part in one of the greatest adventure stories of the 20th century is hardly known outside his own country, even by fellow explorers. Yet as Scott was nearing the pole and with the rest of the world still unaware of Amundsen's triumph, Shirase and his team sailed into Antarctica's Bay of Whales in the smallest ship ever to try its luck in these dangerous waters.

Since boyhood Shirase had dreamed of becoming a polar explorer. Like Amundsen, he initially set his sights on the North Pole. But after the American Robert Peary claimed to have reached it in 1909, both men hastily altered their plans. Instead they would aim for the last big prize: the South Pole. In January 1910, Shirase put his plans before Japanese government officials, promising to raise the flag at the South Pole within three years. For many of them, the question wasn't could he do it but why would it be worth doing? 15 years earlier the International Geographical Congress had said that as the last unknown continent the Antarctic offered the chance to add to knowledge in almost every branch of science. So, like the British, Shirase presented his expedition as a search for knowledge: he would bring back fossils, make meteorological measurements and explore unknown parts of the continent.

The response from the government was cool, however, and Shirase struggled to raise funds. Fortunately, a few months later, Japan's former prime minister Shigenobu Okuma came to Shirase's rescue. With Okuma's backing, Shirase got together just enough money to buy and equip a small ship. He eventually acquired a scientist, too, called Terutaro Takeda. At the end of November 1910, his ship the Kainan Maru finally left Tokyo with 27 men and 28 Siberian dogs on board. Before leaving, Shirase confidently outlined his plans to the media. He would sail to New Zealand, then reach Antarctica in February, during the southern summer, and then proceed to the pole the following spring. This was not to be, however. Bad weather delayed the expedition and they didn't reach New Zealand until 8 February; Amundsen and Scott had already been in Antarctica for a month, preparing for winter. In New Zealand local reporters were astonished: the ship was half the size of Amundsen's ship. True, it was reinforced with iron plate and extra wood, but the ship had only the feeblest engine to help force its way through ice. Few doubted Shirase's courage, but most reckoned the expedition to be ill-prepared as the Japanese had only lightweight sledges for transport across the ice, made of bamboo and wood.

But Shirase's biggest challenge was time. Antarctica is only accessible by sea for a few weeks in summer and expeditions usually aimed to arrive in January or February. 'Even with their determination and daring, our Japanese friends are running it rather fine,' wrote local reporters. Nevertheless, on 11 February the Kainan Maru left New Zealand and sailed straight into the worst weather the captain had ever seen. Then, on 6 March, they approached the coastline of Antarctica's Ross Sea, looking for a place to land. The ice began to close in, threatening to trap them for the winter, an experience no one was likely to survive. With a remarkable piece of seamanship, the captain steered the ship out of the ice and turned north. They would have to wait out the winter in a warmer climate.

A year later than planned, Shirase and six men finally reached Antarctica. Catching up with Scott or Amundsen was out of the question and he had said he would stick to science this time. Yet Shirase still felt the pull of the pole and eventually decided he would head southward to experience the thrills and hardships of polar exploration he had always dreamed of. With provisions for 20 days, he and four men would see how far they could get.

Shirase set off on 20 January 1912 with Takeda and two dog handlers, leaving two men at the edge of the ice shelf to make meteorological measurements. For a week they struggled through one blizzard after another, holing up in their tents during the worst of the weather. The temperature fell to -25°C, and frostbite claimed some of the dogs. On 26 January, Shirase estimated there were enough provisions to continue for two more days. Two days later, he announced it was time to turn back. Takeda calculated they had reached 80° 5 south and had travelled 250 kilometres. The men hoisted the Japanese flag.

On 3 February, all the men were heading home. The ship reached Tokyo in June 1912 – and Shirase was greeted like a hero despite the fact that he never reached the pole. Nor did he contribute much to science – but then nor did Amundsen, whose only interest was in being first to the pole. Yet Shirase's expedition was heroic. They travelled beyond 80° south, one of only four teams to have gone so far south at the time. Furthermore, they did it all without the advantages of the other teams and with no previous experience.`,
          blocks: [
            {
              type: "tfng",
              title: "Questions 1-8",
              instructions: [
                "Do the following statements agree with the information given in Reading Passage 1?",
                "Write TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, or NOT GIVEN if there is no information on this.",
              ],
              items: [
                { q: 1, text: "Shirase's trip to the South Pole is well-known to other explorers." },
                { q: 2, text: "Since Shirase arrived in Antarctica, smaller ships have also made the journey." },
                { q: 3, text: "Shirase's original ambition was to travel to the North Pole." },
                { q: 4, text: "Some Japanese officials thought Shirase's intention to travel to the South Pole was pointless." },
                { q: 5, text: "The British team announced their decision to carry out scientific research in Antarctica before Shirase." },
                { q: 6, text: "Shirase found it easy to raise the money he needed for his trip to the South Pole." },
                { q: 7, text: "A previous prime minister of Japan persuaded a scientist to go with Shirase." },
                { q: 8, text: "The weather that slowed down Shirase's progress to New Zealand was unusually bad for the season." },
              ],
            },
            {
              type: "mcq",
              title: "Questions 9-13",
              instructions: ["Choose the correct letter, A, B, C or D."],
              items: [
                { q: 9, text: "When reporters in New Zealand met Shirase, they were", choices: { A: "concerned about the quality of his equipment.", B: "impressed with the design of his ship.", C: "certain he was unaware of the dangers ahead.", D: "surprised by the bravery he demonstrated." } },
                { q: 10, text: "What are we told about the captain of the Kainan Maru in the fifth paragraph?", choices: { A: "He had given Shirase some poor advice.", B: "His skill at sailing saved the boat and crew.", C: "He refused to listen to the warnings of others.", D: "He was originally confident they could reach Antarctica." } },
                { q: 11, text: "After Shirase finally reached Antarctica he realised that", choices: { A: "he was unsure of the direction he should follow.", B: "he would have to give up on fulfilling his personal ambition.", C: "he might not have enough food to get to the South Pole.", D: "he still wanted to compete in the race against the other teams." } },
                { q: 12, text: "What is the writer doing in the seventh paragraph?", choices: { A: "criticising a decision concerning scientific research.", B: "explaining why a particular mistake had occurred.", C: "describing the conditions that the expedition faced.", D: "rejecting the idea that Shirase was poorly prepared." } },
                { q: 13, text: "What is the writer's main point in the final paragraph?", choices: { A: "Considering the problems Shirase had to deal with, his achievement was incredible.", B: "In Japan, the reaction to Shirase's adventure in Antarctica came as a surprise to him.", C: "It was obvious that Amundsen would receive more attention as an explorer than Shirase.", D: "Shirase had achieved more on the Antarctic expedition than even he had expected." } },
              ],
            },
          ],
        },
        {
          id: "part2",
          passageText: `The rise of agribots

The next time you stand at the supermarket checkout, spare a thought for the farmers who helped fill your shopping basket as life is hard for them right now. This, in turn, inevitably means bigger grocery bills for consumers, and greater hardship for the millions in countries where food shortages are a matter of life and death. Worse, studies suggest that the world will need twice as much food by 2050. Yet while farmers must squeeze more out of the land, they must also address the necessity of reducing their impact on the soil, waterways and atmosphere. All this means rethinking how agriculture is practised, and taking automation to a whole new level. On the new model farms of the future, precision will be key. Why dose a whole field with chemicals if you can spray only where they are needed? Each plant could get exactly the right amount of everything, no more or less, an approach that could slash chemical use and improve yields in one move. But this is easier said than done; the largest farms in Europe and the U.S. can cover thousands of acres. That's why automation is key to precision farming. Specifically, say agricultural engineers, precision farming needs robot farmers.

One day, we might see fields with 'agribots' (agricultural robots) that can identify individual seedlings and encourage them along with drops of fertilizer. Other machines would distinguish problem weeds from crops and eliminate them with shots from high-power lasers or a microdot of pesticide. These machines will also be able to identify and harvest all kinds of vegetables. More than a century of mechanization has already turned farming into an industrial-scale activity in much of the world, with farms that grow cereals being the most heavily automated.

But a variety of other crops, including oranges and tomatoes destined to become processed foods, are also picked mechanically, albeit to a slightly lesser extent. Yet the next wave of autonomous farm machinery is already at work. You probably haven't even noticed, for these robots are disguised as tractors. Many are self-steering, use GPS to cross a field, and can even 'talk' to their implements – a plough or sprayer, for example. And the implements can talk back, telling the tractor that it's going too fast or needs to move to the left. This kind of communication is also being developed in other farm vehicles. A new system allows a combine harvester, say, to send a call over to a tractor-trailer so the driver can unload the grain as and when necessary.

However, when fully autonomous systems take to the field, they'll look nothing like tractors. With their enormous size and weight, today's farm machines have significant downsides: they compact the soil, reducing porosity and killing beneficial life, meaning crops don't grow so well. Simon Blackmore, who researches agricultural technology at Harper Adams University College in England, believes that fleets of lightweight autonomous robots have the potential to solve this problem and that replacing brute force with precision is key. 'A seed only needs one cubic centimeter of soil to grow. If we cultivate just that we only put tiny amounts of energy in and the plants still grow nicely.'

There is another reason why automation may be the way forward according to Eldert van Henten, a robotics researcher at Wageningen University in the Netherlands. 'While the population is growing and needs to be fed, a rapidly shrinking number of people are willing to work in agriculture,' he points out. Other researchers such as Linda Calvin, an economist at the U.S. Department of Agriculture, and Philip Martin at the University of California, Davis, have studied trends in mechanization to predict how US farms might fare. Calvin and Martin have observed how rising employment costs have led to the adoption of labour-saving farm technology in the past, citing the raisin industry as an example. In 2000, a bumper harvest crashed prices and, with profits squeezed, farmers looked for a solution. With labour one of their biggest costs – 42 percent of production expenses on U.S. farms, on average – they started using a mechanical harvester adapted from a machine used by wine makers. By 2007, almost half of California's raisins were mechanically harvested and a labour force once numbering 50,000 had shrunk to 30,000.

As well as having an impact on the job market, the widespread adoption of agribots might bring changes at the supermarket. Lewis Holloway, who studies agriculture at the University of Hull, UK, says that robotic milking is likely to influence the genetics of dairy herds as farmers opt for 'robot-friendly' cows, with udder shape, and even attitudes, suited to automated milking. Similarly, he says, it's conceivable that agribots could influence what fruit or vegetable varieties get to the shops, since farmers may prefer to grow those with, say, leaf shapes that are easier for their robots to discriminate from weeds. Almost inevitably, these machines will eventually alter the landscape, too. The real tipping point for robot agriculture will come when farms are being designed with agribots in mind, says Salah Sukkarieh, a robotics researcher at the Australian Center for Field Robotics, Sydney. This could mean a return to smaller fields, with crops planted in grids rather than rows and fruit trees pruned into two-dimensional shapes to make harvesting easier. This alien terrain tended by robots is still a while away, he says, 'but it will happen.'`,
          blocks: [
            {
              type: "tfng",
              title: "Questions 14-17",
              instructions: [
                "Do the following statements agree with the claims of the writer in Reading Passage 2?",
                "Write YES if the statement agrees with the claims of the writer, NO if the statement contradicts the claims of the writer, or NOT GIVEN if it is impossible to say what the writer thinks about this.",
              ],
              items: [
                { q: 14, text: "Governments should do more to ensure that food is generally affordable." },
                { q: 15, text: "Farmers need to reduce the harm they do to the environment." },
                { q: 16, text: "In the future, farmers are likely to increase their dependency on chemicals." },
                { q: 17, text: "Farms in Europe and the US may find it hard to adapt to precision farming." },
              ],
            },
            {
              type: "sentenceGaps",
              title: "Questions 18-21",
              instructions: [
                "Complete the sentences below.",
                "Choose ONE WORD ONLY from the passage for each answer.",
              ],
              items: [
                { q: 18, text: "In the future, agribots will provide", tail: " to young plants." },
                { q: 19, text: "Some machines will use chemicals or", tail: " to get rid of unwanted plants." },
                { q: 20, text: "It is the production of", tail: " which currently uses most machinery on farms." },
                { q: 21, text: "", leadingBlank: true, text2: "between machines such as tractors is making farming more efficient." },
              ],
            },
            {
              type: "endingsMatch",
              title: "Questions 22-26",
              instructions: [
                "Look at the following researchers (Questions 22-26) and the list of statements below.",
                "Match each researcher with the correct statement, A-H.",
              ],
              endings: {
                A: "The use of automation might impact on the development of particular animal and plant species.",
                B: "We need to consider the effect on employment that increased automation will have.",
                C: "We need machines of the future to be exact, not more powerful.",
                D: "As farming becomes more automated the appearance of farmland will change.",
                E: "New machinery may require more investment than certain farmers can afford.",
                F: "There is a shortage of employees in the farming industry.",
                G: "There are limits to the environmental benefits of automation.",
                H: "Economic factors are often the driving force behind the development of machinery.",
              },
              items: [
                { q: 22, text: "Simon Blackmore" },
                { q: 23, text: "Eldert van Henten" },
                { q: 24, text: "Linda Calvin and Philip Martin" },
                { q: 25, text: "Lewis Holloway" },
                { q: 26, text: "Salah Sukkarieh" },
              ],
            },
          ],
        },
        {
          id: "part3",
          passageText: `Homer's Literary Legacy

A Until the last tick of history's clock, cultural transmission meant oral transmission and poetry, passed from mouth to ear, was the principal medium of moving information across space and from one generation to the next. Oral poetry was not simply a way of telling lovely or important stories, or of flexing the imagination. It was, argues the classicist Eric Havelock, a "massive repository of useful knowledge, a sort of encyclopedia of ethics, politics, history and technology which the effective citizen was required to learn as the core of his educational equipment". The great oral works transmitted a shared cultural heritage, held in common not on bookshelves, but in brains. In India, an entire class of priests was charged with memorizing the Vedas with perfect fidelity. In pre-Islamic Arabia, people known as Rawis were often attached to poets as official memorizers. The Buddha's teachings were passed down in an unbroken chain of oral tradition for four centuries until they were committed to writing in Sri Lanka in the first century B.C.

B The most famous of the Western tradition's oral works, and the first to have been systematically studied, were Homer's Odyssey and Iliad. These two poems – possibly the first to have been written down in the Greek alphabet – had long been held up as literary archetypes. However, even as they were celebrated as the models to which all literature should aspire, Homer's masterworks had also long been the source of scholarly unease. The earliest modern critics sensed that they were somehow qualitatively different from everything that came after – even a little strange. For one thing, both poems were oddly repetitive in the way they referred to characters. Odysseus was always "clever Odysseus". Dawn was always "rosy-fingered". Why would someone write that? Sometimes the epithets seemed completely off-key. Why call the murderer of Agamemnon "blameless Aegisthos"? Why refer to "swift-footed Achilles" even when he was sitting down? Or to "laughing Aphrodite" even when she was in tears? In terms of both structure and theme, the Odyssey and Iliad were also oddly formulaic, to the point of predictability. The same narrative units – gathering armies, heroic shields, challenges between rivals – pop up again and again, only with different characters and different circumstances. In the context of such finely spun, deliberate masterpieces, these quirks seemed hard to explain.

C At the heart of the unease about these earliest works of literature were two fundamental questions: first, how could Greek literature have been born ex nihilo with two masterpieces? Surely a few less perfect stories must have come before, and yet these two were among the first on record. And second, who exactly was their author? Or was it authors? There were no historical records of Homer, and no trustworthy biography of the man exists beyond a few self-referential hints embedded in the texts themselves.

D Jean-Jacques Rousseau was one of the first modern critics to suggest that Homer might not have been an author in the contemporary sense of a single person who sat down and wrote a story and then published it for others to read. In his 1781 Essay on the Origin of Languages, the Swiss philosopher suggested that the Odyssey and Iliad might have been "written only in men's memories. Somewhat later they were laboriously collected in writing" – though that was about as far as his enquiry into the matter went.

E In 1795, the German philologist Friedrich August Wolf argued for the first time that not only were Homer's works not written down by Homer, but they weren't even by Homer. They were, rather, a loose collection of songs transmitted by generations of Greek bards, and only redacted in their present form at some later date. In 1920, an eighteen-year-old scholar named Milman Parry took up the question of Homeric authorship as his Master's thesis at the University of California, Berkeley. He suggested that the reason Homer's epics seemed unlike other literature was because they were unlike other literature. Parry had discovered what Wood and Wolf had missed: the evidence that the poems had been transmitted orally was right there in the text itself. All those stylistic quirks, including the formulaic and recurring plot elements and the bizarrely repetitive epithets – "clever Odysseus" and "gray-eyed Athena" – that had always perplexed readers were actually like thumbprints left by a potter: material evidence of how the poems had been crafted. They were mnemonic aids that helped the bard or bards fit the meter and pattern of the line, and remember the essence of the poems.

F The greatest author of antiquity was actually, Parry argued, just "one of a long tradition of oral poets that composed wholly without the aid of writing". Parry realised that if you were setting out to create memorable poems, the Odyssey and the Iliad were exactly the kind of poems you'd create. It's said that clichés are the worst sin a writer can commit, but to an oral bard, they were essential. The very reason that clichés so easily seep into our speech and writing – their insidious memorability – is exactly why they played such an important role in oral storytelling. The principles that the oral bards discovered as they sharpened their stories through telling and retelling were the same mnemonic principles that psychologists rediscovered when they began conducting their first scientific experiments on memory around the turn of the twentieth century. Words that rhyme are much more memorable than words that don't, and concrete nouns are easier to remember than abstract ones. Finding patterns and structure in information is how our brains extract meaning from the world, and putting words to music and rhyme is a way of adding extra levels of pattern and structure to language.`,
          blocks: [
            {
              type: "endingsMatch",
              title: "Questions 27-32",
              instructions: [
                "Reading Passage 3 has six paragraphs, A-F.",
                "Which paragraph contains the following information?",
                "You may use any letter more than once.",
              ],
              endings: {
                A: "Paragraph A",
                B: "Paragraph B",
                C: "Paragraph C",
                D: "Paragraph D",
                E: "Paragraph E",
                F: "Paragraph F",
              },
              items: [
                { q: 27, text: "the claim that the Odyssey and Iliad were not poems in their original form." },
                { q: 28, text: "a theory involving the reinterpretation of the term 'author'" },
                { q: 29, text: "references to the fact that little is known about Homer's life" },
                { q: 30, text: "a comparison between the construction of Homer's poems and another art form" },
                { q: 31, text: "examples of the kinds of people employed to recall language" },
                { q: 32, text: "doubts regarding Homer's apparently inappropriate descriptions" },
              ],
            },
            {
              type: "endingsMatch",
              title: "Questions 33-34",
              instructions: [
                "Choose TWO letters, A-E.",
                "Which TWO of these points are made by the writer of the text about the Odyssey and the Iliad?",
              ],
              endings: {
                A: "They are sometimes historically inaccurate.",
                B: "It is uncertain which century they were written in.",
                C: "Their content is very similar.",
                D: "Later writers referred to them as ideal examples of writing.",
                E: "There are stylistic differences between them.",
              },
              items: [
                { q: 33, text: "First selected point" },
                { q: 34, text: "Second selected point" },
              ],
            },
            {
              type: "endingsMatch",
              title: "Questions 35-36",
              instructions: [
                "Choose TWO letters, A-E.",
                "Which TWO of the following theories does the writer of the text refer to?",
              ],
              endings: {
                A: "Homer wrote his work during a period of captivity.",
                B: "Neither the Odyssey nor the Iliad were written by Homer.",
                C: "Homer created the Odyssey and Iliad without writing them down.",
                D: "Homer may have suffered from a failing memory in later life.",
                E: "The oral and written versions of Homer's work may not be identical.",
              },
              items: [
                { q: 35, text: "First selected theory" },
                { q: 36, text: "Second selected theory" },
              ],
            },
            {
              type: "sentenceGaps",
              title: "Questions 37-40",
              instructions: [
                "Complete the summary below.",
                "Choose ONE WORD ONLY from the passage.",
              ],
              items: [
                { q: 37, text: "Spoken poetry was once the means by which each", tail: " of a particular culture or community could pass on its knowledge." },
                { q: 38, text: "Indeed, it has been suggested that it was the duty of a", tail: " to know poetry so they would be informed about subjects such as politics and history." },
                { q: 39, text: "Psychologists now know that when people are trying to remember information, they may find it difficult to remember words that express", tail: " ideas." },
                { q: 40, text: "It is easier to remember words which sound similar or go together with", tail: "." },
              ],
            },
          ],
        },
      ],
    },
  };

const test8 = {
  listening: {
    audioSrc: "https://audio.ieltsmock.org/CL4e.mp3",
    html: `
      <div class="listen-page" id="listenSec1">
        <div class="listen-block">
          <div class="listen-h">SECTION 1 - Questions 1-10</div>

          <div class="listen-card">
            <div class="listen-card-title">Questions 1-3</div>
            <div class="listen-inst">Choose the correct letter, <b>A, B or C</b>.</div>

            <div class="mcq">
              <div class="mcq-q"><span class="qnum">1</span> The food will be placed</div>
              <label class="mcq-opt"><input type="radio" name="t8q1" value="A" data-lq-radio="1"> A) in the office.</label>
              <label class="mcq-opt"><input type="radio" name="t8q1" value="B" data-lq-radio="1"> B) in the training room.</label>
              <label class="mcq-opt"><input type="radio" name="t8q1" value="C" data-lq-radio="1"> C) outside the training room.</label>
            </div>

            <div class="mcq">
              <div class="mcq-q"><span class="qnum">2</span> The company is only providing food at lunchtime because</div>
              <label class="mcq-opt"><input type="radio" name="t8q2" value="A" data-lq-radio="2"> A) attendees will already have had breakfast.</label>
              <label class="mcq-opt"><input type="radio" name="t8q2" value="B" data-lq-radio="2"> B) breakfast is more expensive than lunch.</label>
              <label class="mcq-opt"><input type="radio" name="t8q2" value="C" data-lq-radio="2"> C) there is only enough money to provide lunch.</label>
            </div>

            <div class="mcq">
              <div class="mcq-q"><span class="qnum">3</span> Which of the following people will be at the lunch?</div>
              <label class="mcq-opt"><input type="radio" name="t8q3" value="A" data-lq-radio="3"> A) the manager</label>
              <label class="mcq-opt"><input type="radio" name="t8q3" value="B" data-lq-radio="3"> B) the secretary</label>
              <label class="mcq-opt"><input type="radio" name="t8q3" value="C" data-lq-radio="3"> C) the trainer</label>
            </div>
          </div>

          <div class="listen-card">
            <div class="listen-card-title">Questions 4-10</div>
            <div class="listen-inst">Complete the form below. Write <b>NO MORE THAN TWO WORDS AND/OR A NUMBER</b> for each answer.</div>
            <div class="listen-card-title">Corporate Catering Order Form</div>
            <div class="listen-notes">
              <div class="note-row">Date of event: <span class="qnum">4</span> <input data-lq="4" class="l-input"></div>
              <div class="note-row">Delivery time: <span class="qnum">5</span> <input data-lq="5" class="l-input"></div>
              <div class="note-row">Number of people: <span class="qnum">6</span> <input data-lq="6" class="l-input tiny"></div>
              <div class="note-row"><b>Standard Buffet</b></div>
              <div class="note-row bullet">Sandwiches</div>
              <div class="note-row bullet">Crisps</div>
              <div class="note-row bullet">Hot and cold drinks</div>
              <div class="note-row">Cost: &pound;<span class="qnum">7</span> <input data-lq="7" class="l-input tiny"></div>
              <div class="note-row"><b>Premium Buffet</b></div>
              <div class="note-row bullet">Sandwiches</div>
              <div class="note-row bullet">Crisps</div>
              <div class="note-row bullet">Salad bowl</div>
              <div class="note-row bullet">Fruit</div>
              <div class="note-row bullet">Cakes</div>
              <div class="note-row bullet">Hot and cold drinks</div>
              <div class="note-row">Cost: &pound;5.50</div>
              <div class="note-row">Dietary requirements: 1 person requires <span class="qnum">8</span> <input data-lq="8" class="l-input"> food.</div>
              <div class="note-row">Contact person: Carol <span class="qnum">9</span> <input data-lq="9" class="l-input"></div>
              <div class="note-row">Telephone number: 455 2298, Extension <span class="qnum">10</span> <input data-lq="10" class="l-input tiny"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="listen-page hidden" id="listenSec2">
        <div class="listen-block">
          <div class="listen-h">SECTION 2 - Questions 11-20</div>

          <div class="listen-card">
            <div class="listen-card-title">Questions 11-20</div>
            <div class="listen-inst">Complete the leaflet below. Write <b>NO MORE THAN THREE WORDS AND/OR A NUMBER</b> for each answer.</div>
            <div class="listen-card-title">Stay Safe During a Heatwave</div>
            <div class="listen-notes">
              <div class="note-row">In the daytime try to limit the amount of <span class="qnum">11</span> <input data-lq="11" class="l-input"> in rooms.</div>
              <div class="note-row">At night, when the temperature is cooler, keep windows open.</div>
              <div class="note-row">Are you using air conditioning? Pay attention to your <span class="qnum">12</span> <input data-lq="12" class="l-input"></div>
              <div class="note-row">Spray cold water on your face or take a <span class="qnum">13</span> <input data-lq="13" class="l-input"></div>
              <div class="note-row">Your wrists and the back of your neck are your body's <span class="qnum">14</span> <input data-lq="14" class="l-input"></div>
              <div class="note-row">Place a cold cloth on these areas.</div>
              <div class="note-row">Eat a healthy diet to replace the nutrients you lose through <span class="qnum">15</span> <input data-lq="15" class="l-input"></div>
              <div class="note-row">Try to stay at home between <span class="qnum">16</span> <input data-lq="16" class="l-input"> as this is the hottest part of the day.</div>
              <div class="note-row">Drink plenty of water!</div>
              <div class="note-row">If you go out in the sun, wear a hat or use an <span class="qnum">17</span> <input data-lq="17" class="l-input"></div>
              <div class="note-row">Wear loose-fitting clothes made from <span class="qnum">18</span> <input data-lq="18" class="l-input"></div>
              <div class="note-row">Take it easy when doing any <span class="qnum">19</span> <input data-lq="19" class="l-input"></div>
              <div class="note-row">Remember your neighbours, especially if they are elderly or have <span class="qnum">20</span> <input data-lq="20" class="l-input"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="listen-page hidden" id="listenSec3">
        <div class="listen-block">
          <div class="listen-h">SECTION 3 - Questions 21-30</div>

          <div class="listen-card">
            <div class="listen-card-title">Questions 21-25</div>
            <div class="listen-inst">Choose the correct letter, <b>A, B or C</b>.</div>

            <div class="mcq">
              <div class="mcq-q"><span class="qnum">21</span> The student did not speak with Professor Collins because</div>
              <label class="mcq-opt"><input type="radio" name="t8q21" value="A" data-lq-radio="21"> A) she did not have the time.</label>
              <label class="mcq-opt"><input type="radio" name="t8q21" value="B" data-lq-radio="21"> B) she could not get an appointment with him.</label>
              <label class="mcq-opt"><input type="radio" name="t8q21" value="C" data-lq-radio="21"> C) he is not around at the moment.</label>
            </div>

            <div class="mcq">
              <div class="mcq-q"><span class="qnum">22</span> When doing assignments, many students</div>
              <label class="mcq-opt"><input type="radio" name="t8q22" value="A" data-lq-radio="22"> A) are surprised to find how difficult they are to write.</label>
              <label class="mcq-opt"><input type="radio" name="t8q22" value="B" data-lq-radio="22"> B) often fail to get the required grades.</label>
              <label class="mcq-opt"><input type="radio" name="t8q22" value="C" data-lq-radio="22"> C) do not provide a full answer.</label>
            </div>

            <div class="mcq">
              <div class="mcq-q"><span class="qnum">23</span> The tutor says that words like <i>analyse</i>, <i>discuss</i> and <i>evaluate</i></div>
              <label class="mcq-opt"><input type="radio" name="t8q23" value="A" data-lq-radio="23"> A) each require a completely different response.</label>
              <label class="mcq-opt"><input type="radio" name="t8q23" value="B" data-lq-radio="23"> B) will often have the same meaning.</label>
              <label class="mcq-opt"><input type="radio" name="t8q23" value="C" data-lq-radio="23"> C) can be difficult to understand.</label>
            </div>

            <div class="mcq">
              <div class="mcq-q"><span class="qnum">24</span> The danger of using certain sources on the internet is that</div>
              <label class="mcq-opt"><input type="radio" name="t8q24" value="A" data-lq-radio="24"> A) the assignment may receive a lower grade.</label>
              <label class="mcq-opt"><input type="radio" name="t8q24" value="B" data-lq-radio="24"> B) they are full of promotions and adverts.</label>
              <label class="mcq-opt"><input type="radio" name="t8q24" value="C" data-lq-radio="24"> C) they are sometimes written by politicians.</label>
            </div>

            <div class="mcq">
              <div class="mcq-q"><span class="qnum">25</span> The books on a reading list</div>
              <label class="mcq-opt"><input type="radio" name="t8q25" value="A" data-lq-radio="25"> A) express fewer opinions than the internet.</label>
              <label class="mcq-opt"><input type="radio" name="t8q25" value="B" data-lq-radio="25"> B) are more critical of other authors.</label>
              <label class="mcq-opt"><input type="radio" name="t8q25" value="C" data-lq-radio="25"> C) have been assessed by other experts.</label>
            </div>
          </div>

          <div class="listen-card">
            <div class="listen-card-title">Questions 26-30</div>
            <div class="listen-inst">Complete the sentences below. Write <b>NO MORE THAN TWO WORDS</b> for each answer.</div>
            <div class="listen-card-title">Proofreading checklist</div>
            <div class="listen-notes">
              <div class="note-row">Make sure you express yourself clearly.</div>
              <div class="note-row"><span class="qnum">26</span> Your paragraphs must be <input data-lq="26" class="l-input"> and in an order that makes sense to the reader.</div>
              <div class="note-row">Check you have given a full answer to the question.</div>
              <div class="note-row"><span class="qnum">27</span> The points you have made should be <input data-lq="27" class="l-input">, not just anything to get to the required word count.</div>
              <div class="note-row">Avoid the use of informal language.</div>
              <div class="note-row"><span class="qnum">28</span> Pay attention to any <input data-lq="28" class="l-input"></div>
              <div class="note-row"><span class="qnum">29</span> Check your <input data-lq="29" class="l-input"> and spelling.</div>
              <div class="note-row"><span class="qnum">30</span> Check your <input data-lq="30" class="l-input"> are grammatically correct.</div>
              <div class="note-row">Check to make sure you have expressed yourself effectively.</div>
            </div>
          </div>
        </div>
      </div>

      <div class="listen-page hidden" id="listenSec4">
        <div class="listen-block">
          <div class="listen-h">SECTION 4 - Questions 31-40</div>

          <div class="listen-card">
            <div class="listen-card-title">Questions 31-32</div>
            <div class="listen-inst">Choose <b>TWO</b> letters, <b>A-E</b>.</div>
            <div class="mcq-q">Which <b>TWO</b> things can result from a lack of strength training?</div>
            <label class="mcq-opt"><input id="t8q31a" name="t8q31group" type="checkbox" data-lq-check="31" value="A" autocomplete="off"> A) A person will not get the benefit of natural activities.</label>
            <label class="mcq-opt"><input id="t8q31b" name="t8q31group" type="checkbox" data-lq-check="31" value="B" autocomplete="off"> B) A person will not do as well in their sport as they could.</label>
            <label class="mcq-opt"><input id="t8q31c" name="t8q31group" type="checkbox" data-lq-check="31" value="C" autocomplete="off"> C) An athlete can no longer practise their sport.</label>
            <label class="mcq-opt"><input id="t8q31d" name="t8q31group" type="checkbox" data-lq-check="31" value="D" autocomplete="off"> D) A person will not be able to visit the gym.</label>
            <label class="mcq-opt"><input id="t8q31e" name="t8q31group" type="checkbox" data-lq-check="31" value="E" autocomplete="off"> E) A person's injuries will get worse.</label>
          </div>

          <div class="listen-card">
            <div class="listen-card-title">Questions 33-37</div>
            <div class="listen-inst">Choose the correct letter, <b>A, B or C</b>.</div>

            <div class="mcq">
              <div class="mcq-q"><span class="qnum">33</span> An injury caused by a fall</div>
              <label class="mcq-opt"><input type="radio" name="t8q33" value="A" data-lq-radio="33"> A) tends to be unexpected.</label>
              <label class="mcq-opt"><input type="radio" name="t8q33" value="B" data-lq-radio="33"> B) needs to be dealt with urgently.</label>
              <label class="mcq-opt"><input type="radio" name="t8q33" value="C" data-lq-radio="33"> C) is often caused by weak muscles.</label>
            </div>

            <div class="mcq">
              <div class="mcq-q"><span class="qnum">34</span> Athletes who do more than one sport</div>
              <label class="mcq-opt"><input type="radio" name="t8q34" value="A" data-lq-radio="34"> A) place too much pressure on their bodies.</label>
              <label class="mcq-opt"><input type="radio" name="t8q34" value="B" data-lq-radio="34"> B) are in particular need of strength training.</label>
              <label class="mcq-opt"><input type="radio" name="t8q34" value="C" data-lq-radio="34"> C) avoid overworking one part of the body.</label>
            </div>

            <div class="mcq">
              <div class="mcq-q"><span class="qnum">35</span> Injuries can be avoided</div>
              <label class="mcq-opt"><input type="radio" name="t8q35" value="A" data-lq-radio="35"> A) if an athlete makes fewer repetitive movements.</label>
              <label class="mcq-opt"><input type="radio" name="t8q35" value="B" data-lq-radio="35"> B) if muscles that are not used as much are exercised.</label>
              <label class="mcq-opt"><input type="radio" name="t8q35" value="C" data-lq-radio="35"> C) if an athlete can learn to keep their balance.</label>
            </div>

            <div class="mcq">
              <div class="mcq-q"><span class="qnum">36</span> A strength training programme</div>
              <label class="mcq-opt"><input type="radio" name="t8q36" value="A" data-lq-radio="36"> A) should also help you move more freely.</label>
              <label class="mcq-opt"><input type="radio" name="t8q36" value="B" data-lq-radio="36"> B) will reduce daily aches and pains.</label>
              <label class="mcq-opt"><input type="radio" name="t8q36" value="C" data-lq-radio="36"> C) is only suitable for particular sports.</label>
            </div>

            <div class="mcq">
              <div class="mcq-q"><span class="qnum">37</span> What problem do older athletes face?</div>
              <label class="mcq-opt"><input type="radio" name="t8q37" value="A" data-lq-radio="37"> A) They eat a poorer diet than younger athletes.</label>
              <label class="mcq-opt"><input type="radio" name="t8q37" value="B" data-lq-radio="37"> B) They are unable to continue doing their chosen sport.</label>
              <label class="mcq-opt"><input type="radio" name="t8q37" value="C" data-lq-radio="37"> C) They lose muscle mass.</label>
            </div>
          </div>

          <div class="listen-card">
            <div class="listen-card-title">Questions 38-40</div>
            <div class="listen-inst">Complete the sentences below. Write <b>NO MORE THAN TWO WORDS</b> for each answer.</div>
            <div class="listen-notes">
              <div class="note-row"><span class="qnum">38</span> Athletes are often less able to practise their sport during the <input data-lq="38" class="l-input"></div>
              <div class="note-row"><span class="qnum">39</span> Seeing improvements brought about by strength training can help athletes develop a <input data-lq="39" class="l-input"></div>
              <div class="note-row"><span class="qnum">40</span> If athletes are prevented from doing their sport for a long time, strength training can help them remain <input data-lq="40" class="l-input"></div>
            </div>
          </div>
        </div>
      </div>
    `,
  },

  writing: {
    task1Type: "Line graph",
    task2Type: "Agree or disagree",
    task1Html: `
      You should spend about 20 minutes on this task.<br>
      The line graph shows the number of players in four different sports (badminton, tennis, basketball, rugby) in a particular European country between 1985 and 2005.<br>
      Summarise the information by selecting and reporting the main features, and make comparisons where relevant.<br>
      <b>Write at least 150 words.</b>
    `,
    task1ImageSrc: "https://audio.ieltsmock.org/f465a3939aaca96c.jpeg",
    task2Html: `
      You should spend about 40 minutes on this task.<br><br>
      In some countries, many children are becoming overweight and unhealthy. Some people say it is the responsibility of governments to solve this problem.<br>
      <b>To what extent do you agree or disagree?</b><br>
      Give reasons for your answer and include any relevant examples from your own knowledge or experience.<br>
      <b>Write at least 250 words.</b>
    `,
  },

  reading: {
    parts: [
      {
        id: "part1",
        passageText: `Coastal defences

The world's coastlines are constantly being reshaped and reworked by the sea. Coastal erosion is one of the natural phenomena that contribute to the creation and destruction of our shores and one of the main processes that form beaches, dunes, mud flats, reefs and marshes along the coast. These different shoreline features have a wide range of functions: they provide habitats for wildlife, prevent flooding and protect fresh water resources inland, and, of course, they provide opportunities for leisure activities like sunbathing. As human activity along the coast continues to increase with the development of towns and industries, managing erosion is becoming a problem of growing importance. The risk of flooding due to rising sea levels, attributed to the effects of global warming, makes finding a solution to erosion a priority. As well as protecting natural habitats, coastal management involves saving homes and businesses from damage or destruction, and failing to do this can have severe consequences for society and the economy.

Coastlines are changed by the sea in two ways: erosion and longshore drift. Erosion happens through different processes, but essentially the action of the sea wears down features of the coastal landscape such as cliffs, beaches and sand dunes before washing them away. Longshore drift happens when waves approach a beach at an angle and move sediment along the coast until eventually the beach changes its shape. The beach may even disappear from its original location and re-form, as sediment is deposited, further down the coast.

There are three basic approaches to coastline management. The first one is to maintain the existing coastal defences but not to build new ones. The second is to build new defences further out at sea in order to reduce pressure on existing defences and even extend the coastline. The third is to retreat, in other words, to move people, homes and businesses away from disappearing coastlines. When the preferred option is to attempt to stop coastline erosion, either hard or soft engineering options can be used.

Hard engineering options are expensive and, in all probability, short term. They tend to have a significant effect on the landscape and environment because of their size and visual impact. Furthermore, they are expensive to build and maintain. Common coastal hard engineering methods are to build a sea wall or groynes; each type of barrier is designed to combat an aspect of coastal change, and in some places more than one type of sea defence can be seen. Sea walls are built at the edge of a coastline and are usually made from reinforced concrete to make them stronger. The walls prevent the sea from washing away the bottom of cliffs, causing the cliffs to fall into the sea. The walls can be vertical, curved or mound walls. Vertical walls were mainly used in the past and are the simplest type of wall. Unfortunately, they are also the most easily damaged by waves as their foundations can be undermined by the sea. Curved seawalls serve to push the waves back out to sea, and the curve prevents water from crashing over the top of the wall. However, deflecting the energy of the waves simply means that erosion takes place further down the coast. Mound sea walls use a mixture of loose material, such as rock and concrete, which has the advantage of absorbing the energy of the waves rather than deflecting it, and cost much less to build. However, they are less effective in storms and have shorter lives than solid sea walls.

Groynes are low walls built at a right angle to the coastline and are used to minimise the effect of longshore drift. They can be built from wood, stones and/or concrete, and are used in groups to break the beach into sections. As a wave hits the side of a groyne, its power is reduced and the material being carried by it is deposited at the side of the groyne. Groynes are less expensive than sea walls to put in place but like mound sea walls, they have a short lifespan.

The alternatives to hard engineering schemes are soft engineering techniques. They are low-cost solutions that have little immediate effectiveness against coastal erosion but are much more sustainable. There are two main kinds of soft engineering options. The first is beach nourishment, which replaces the sand and pebbles washed away by the sea. This avoids the need for expensive sea walls but sand needs to be moved constantly to maintain the beach. Unfortunately, because this option does not stop natural erosion by the sea, a larger quantity of material is deposited further down the coast. The second option, managed retreat, avoids coastal management and construction projects and allows areas of the coast to erode and flood naturally. Managed retreat usually takes place in areas of low economic value. The advantage of this method is that it encourages the development of beaches and salt marshes, two kinds of environments that are natural defences against the sea. The second advantage is, of course, that it is cheap.

Coastal management is difficult as local people, farmers and the agricultural industry, environmentalists, tourist authorities and other economic interests will have different opinions about what should be done. The importance of the issue is obvious from just one statistic: 45% of the world's population live within 100 kilometres of the coast. As sea levels rise and storm energy increases, the problems of coastal management are going to become ever more intense and pressing.`,
        blocks: [
          {
            type: "summarySelect",
            title: "Questions 1-5",
            instructions: [
              "Complete the summary using the list of words, A-I, below.",
              "Write the correct letter, A-I, for each answer.",
            ],
            summaryTitle: "Coastal erosion and management",
            summaryLines: [
              { blankQ: 1, text: "Coastal erosion can create several different types of", tail: ", which have many different" },
              { blankQ: 2, before: "", after: "in the changing coastal environment. These include providing environments for wildlife to live, stopping floods and protecting water supplies. The increasing" },
              { blankQ: 3, before: "", after: "of homes and businesses on or near the coast means that managing our coastline is a(n)" },
              { blankQ: 4, before: "", after: "for many countries around the world. If this cannot be done effectively, there could be severe effects on" },
              { blankQ: 5, text: "", tail: "" },
            ],
            optionsTitle: "Options",
            options: [
              { letter: "A", word: "crisis" },
              { letter: "B", word: "priority" },
              { letter: "C", word: "landscape" },
              { letter: "D", word: "management" },
              { letter: "E", word: "economy" },
              { letter: "F", word: "roles" },
              { letter: "G", word: "society" },
              { letter: "H", word: "resources" },
              { letter: "I", word: "development" },
            ],
          },
          {
            type: "sentenceGaps",
            title: "Questions 6-8",
            instructions: [
              "Complete the sentences below.",
              "Choose ONE WORD ONLY from the passage for each answer.",
            ],
            items: [
              { q: 6, text: "Erosion occurs when features of the coast are worn down by the sea's", tail: "." },
              { q: 7, text: "Shorelines are reshaped when materials are washed down the coast because waves hit beaches at an", tail: "." },
              { q: 8, text: "Beaches can move and", tail: "some distance away from their original position." },
            ],
          },
          {
            type: "sentenceGaps",
            title: "Questions 9-12",
            instructions: [
              "Complete the flow-chart below.",
              "Choose ONE WORD from the passage for each answer.",
            ],
            items: [
              { q: 9, text: "Vertical sea walls: the foundations are often", tail: "by the sea." },
              { q: 10, text: "Curved sea walls: stop waves", tail: "over the wall." },
              { q: 11, text: "Mound sea walls: capable of", tail: "wave energy." },
              { q: 12, text: "Groynes: do not have a long", tail: "." },
            ],
          },
          {
            type: "mcq",
            title: "Questions 13-14",
            instructions: ["Choose the correct letter, A, B, C or D."],
            items: [
              {
                q: 13,
                text: "Which statement is NOT TRUE about beach nourishment?",
                choices: {
                  A: "Sea walls are not needed.",
                  B: "Coastal materials have to be replaced often.",
                  C: "More coastal material is carried further down the coast.",
                  D: "It involves building roads to bring materials to the coast.",
                },
              },
              {
                q: 14,
                text: "Which statement is TRUE about managed retreat?",
                choices: {
                  A: "Salt marshes and cliffs are usually created as a result.",
                  B: "It is used in areas of little commercial interest.",
                  C: "Not a lot of land is lost to the sea.",
                  D: "The costs of managed retreat are high.",
                },
              },
            ],
          },
        ],
      },
      {
        id: "part2",
        passageText: `Team working

The ability to work in a team is one that is prized by employers and educationalists alike. It is often requested in job advertisements and displayed on CVs. When employers list their most important skills for promotion, 86% list team working skills. The willingness and ability to work with a group of people towards a single target has become increasingly important in an era when soft skills like communication, creativity, critical thinking and collaboration are essential in work and study. Today's teams are different from those of the past because a team is likely to change membership more often, will be more socially diverse and its members could be located over a wider area, even globally.

In 1965 psychologist Bruce Tuckman recognised that team building goes through different stages, from a collection of individuals to a fully functioning unit. Tuckman did not study groups himself; he reviewed articles about group development. He found that the articles described two features that all the groups had in common: individual interactions and the task activity. Tuckman recognised that groups evolve and he suggested that they do so via four stages that he called forming, storming, norming and performing. Briefly, in the first stage, forming, people are getting to know each other and finding their roles in the new hierarchy. In the second stage, storming, there are conflicts between members as differences emerge about issues such as what the team is being asked to do and how to do it. In the third phase, norming, team members start to work together. They establish processes about who will do what, when and how, and there is a growing sense of cooperation in the team. In the fourth stage, performing, the team now has a shared set of norms and has learned how to work well together. The individual members focus less on their position in the team and how to work together and more on their tasks. Tuckman later added a further, final stage, adjourning, to his model. In this final stage, the team stops working together, celebrates its success and reflects on its performance and achievements.

The value of Tuckman's model is that it enables us to see team working as a process dependent on interpersonal relationships and the team's interaction with the task. It gives managers and educators a simple, staged model to help them form teams and support the team members as they try to understand where they are in the process. According to the model, all teams are likely to go through these stages in this order, and although it is also possible to go backwards, for example from storming to forming, when a team does this, it must go through the other stages in the same order again. However, the model has been criticised and alternatives have been proposed. Firstly, Tuckman's model was not based on first-hand observations and evidence, and it seems that where the model has been tested, the reality was different from that predicted by the model. A study by the Monterey Naval Postgraduate School showed that only 2% of the teams observed went through all four stages. Furthermore, storming, or conflict, continues throughout the duration of the team's life and conflict happens frequently. Secondly, Tuckman's model excluded external factors such as the nature of the task the group has been given and how this affects progress. Thirdly, the model predicts stability and specialisation: the longer the team stays together, the better it becomes at its task or tasks.

The problem is that when teams become too specialised, this leads to silo working, where teams focus on one task and become territorial about sharing ideas, knowledge and expertise with others in the organisation. In fact, some researchers, like Klaus Schauser at the University of California, have suggested that there is a sixth stage to Tuckman's model: stagnation. Newer companies, especially in the technology sector, require agile or flexible teams, and have built their company culture around a process called reteaming, or breaking up teams to build new ones. This enables team members to move between groups so that teams learn from each other. Some online gaming and music streaming companies are noted for their reteaming techniques, believing that this gives them the flexibility to move with their markets and to change and adapt swiftly. One way to re-organise teams is to create situations where a team has to make an effort to recruit new members and there is an ongoing effort to bring in new people. Another way is to let a team grow until it is big enough to divide into two teams; the advantage is that both teams are used to working with each other and so are now two effective working groups. When there is a single temporary problem to solve, volunteers can come together to form a temporary task team. After the work on the problem is completed, the team breaks up and the members re-join their old group. Finally, team members can swap places between teams in order to share learning across the organisation.`,
        blocks: [
          {
            type: "sentenceGaps",
            title: "Questions 15-19",
            instructions: [
              "Complete the table below.",
              "Choose ONE WORD ONLY from the passage for each answer.",
            ],
            items: [
              { q: 15, text: "Forming: people become acquainted with each other and learn where they fit into the group's", tail: "." },
              { q: 16, text: "Storming: differences", tail: "in the team about the task members are being asked to do and the way to do it." },
              { q: 17, text: "Norming: team", tail: "improves as people learn how to work with each other." },
              { q: 18, text: "Performing: the team understands how to work together according to agreed", tail: "." },
              { q: 19, text: "Adjourning: the team breaks up and can think about its", tail: "and successes." },
            ],
          },
          {
            type: "multiTextChoices",
            title: "Questions 20-21",
            instructions: [
              "The list below describes some of the features of Tuckman's model.",
              "Which TWO points are mentioned by the writer of the text?",
              "Choose TWO letters, A-E. Type one letter in each box.",
            ],
            choices: [
              { letter: "A", text: "It regards team working as a process dependent on good managers." },
              { letter: "B", text: "It helps managers support their staff as they try to form working teams." },
              { letter: "C", text: "It helps managers monitor the performance of their teams." },
              { letter: "D", text: "It is based on research carried out by Tuckman in the workplace." },
              { letter: "E", text: "It proposes that teams can return to a previous stage before moving to the next one." },
            ],
            items: [
              { q: 20, text: "First answer" },
              { q: 21, text: "Second answer" },
            ],
          },
          {
            type: "multiTextChoices",
            title: "Questions 22-23",
            instructions: [
              "The list below describes some of the shortcomings of Tuckman's model.",
              "Which TWO points are mentioned by the writer of the text?",
              "Choose TWO letters, A-E. Type one letter in each box.",
            ],
            choices: [
              { letter: "A", text: "It only applies to schools of postgraduate studies." },
              { letter: "B", text: "It incorrectly forecasts that teams become unstable and unable to perform well." },
              { letter: "C", text: "It does not predict how long a team can stay together." },
              { letter: "D", text: "It does not consider outside influences that affect people's work." },
              { letter: "E", text: "It does not predict what actually happens at work." },
            ],
            items: [
              { q: 22, text: "First answer" },
              { q: 23, text: "Second answer" },
            ],
          },
          {
            type: "tfng",
            title: "Questions 24-29",
            instructions: [
              "Do the following statements agree with the information given in Reading Passage 2?",
              "Choose TRUE, FALSE or NOT GIVEN.",
            ],
            items: [
              { q: 24, text: "Modern tech companies do not like people working in a team for more than six months." },
              { q: 25, text: "Technology companies routinely dissolve teams to form new ones." },
              { q: 26, text: "Reteaming means that technology companies cannot respond quickly to changes in the market." },
              { q: 27, text: "Technology companies routinely recruit new team members from outside the company." },
              { q: 28, text: "Some teams are left to grow until they are big enough to make two smaller teams." },
              { q: 29, text: "Sometimes, people from one team will join another to make a new temporary team focused on a single task." },
            ],
          },
        ],
      },
      {
        id: "part3",
        passageText: `Artificial curation

We all know that too much information can be a bad thing - this is as true in daily life as it is in business. Filtering useful from useless information has become a growing problem, bringing confusion with it, but this is where data curation can help. Curating data involves finding and displaying patterns in large volumes of disconnected and messy data to create meaningful information and suggestions for the end user. The process of data collection to inform business and consumer choice has developed from collecting information via questionnaires and interviews to digitalising information and using technology to gather and interpret data. The latter requires huge databases for computer algorithms, sets of computer instructions, to search and find patterns in order to predict what choices we might make. The use of algorithms is called AI curation, and from shopping to social media, it is part of our lives.

AI curation involves designing computer algorithms that work with large amounts of data. The data is gathered from people's past internet use, for example, searches, purchases, likes and bookmarks. The algorithm looks for patterns in this historical data and uses these patterns to predict the user's choices. The patterns and predictions help the algorithm search and sort through the huge volume of information on the internet and present items that the user has previously looked for or liked or bought. For example, if a person has searched for a particular product online, the algorithm may make suggestions for other products or websites the person might be interested in. If the consumer goes on to click through to the website or to buy something that has been recommended, then the algorithm has found a winning pattern for that individual.

Algorithms make it possible to collect data about a target audience and consequently, they determine which adverts we see as we browse the internet as well as which news stories are shown to us. The purpose of this is to increase our engagement with a particular company or website and thus generate revenue. AI curation has other benefits too. In the recent past, when we wanted information about the news, we went to a news site and if we were interested in sports news, for example, we searched for sports news within that news site. With AI curation, based on our searches and our likes, we have the sports news brought directly to us. Users see what they are mostly interested in and, conversely, see less of what they don't want to. They can therefore build a relationship with websites they frequently visit as content and products are personalised for them, building loyalty and trust. Finally, they are able to focus on certain information and build up specialist knowledge about the things they are interested in. They can even connect with other users who are interested in the same subject and form communities based on that particular topic.

Although algorithms are good to some extent at curating virtual information for us and putting forward suggestions, some companies are moving away from AI and back to human recommendations. Humans have always played a role in some areas of internet curation, particularly news or stories where people have to moderate or make a choice about what is suitable or not for an audience. There have been several cases where algorithms have spread stories that were partially or wholly untrue or presented content that was not suitable for younger people. Some social media companies are bringing back human editors because algorithms cannot distinguish between stories that have on-the-record sources and stories that are simply made up. The other thing a recommendation algorithm can't do is to tell you why it is desirable to use a product - what makes it great or different or better than a rival product. Neither can it give its recommendation the human touch, and people usually prefer recommendations from other people. The problem with human curation, however, is that there just isn't enough of it to deal with all the information, particularly when algorithms are cheaper and much more efficient.

It seems that the best way forward is a solution that uses both AI and human curation. One news company that works in this way starts by asking its users to pick articles for others to read. These stories form the basis for algorithms to work with. The algorithms then gather similar stories for the next stage. When the algorithm has compiled stories from various internet sources, a human editor fine-tunes the selection for the audience. For example, if the AI curator is asked for stories about famous people, it may deliver sensational or even misleading stories because these are the ones that have received the most clicks. At this point, the human curator intervenes and deletes inappropriate content in favour of better stories. It seems that putting a human curator alongside AI can give a better quality of curation and create trust in the recommendations as well as a personal connection that isn't offered by an algorithm alone.`,
        blocks: [
          {
            type: "sentenceGaps",
            title: "Questions 30-32",
            instructions: [
              "Complete the sentences below.",
              "Choose ONE WORD ONLY from the passage for each answer.",
            ],
            items: [
              { q: 30, text: "The amount of data that is available to companies is too great to be useful and results in", tail: "." },
              { q: 31, text: "AI curation means that a computer program looks for and shows", tail: "in large amounts of data." },
              { q: 32, text: "Technology is applied to digital information to collect and", tail: "the data." },
            ],
          },
          {
            type: "multiTextChoices",
            title: "Questions 33-34",
            instructions: [
              "Which TWO things does an algorithm do?",
              "Choose TWO letters, A-E. Type one letter in each box.",
            ],
            choices: [
              { letter: "A", text: "It reviews past interactions by the user on the internet to gather data." },
              { letter: "B", text: "It helps to build relationships between the user and their preferred websites." },
              { letter: "C", text: "It uses people's responses to create advertisements." },
              { letter: "D", text: "It collects information from other algorithms." },
              { letter: "E", text: "It presents information that we do not want to see." },
            ],
            items: [
              { q: 33, text: "First answer" },
              { q: 34, text: "Second answer" },
            ],
          },
          {
            type: "multiTextChoices",
            title: "Questions 35-36",
            instructions: [
              "Which TWO things can't an AI algorithm do?",
              "Choose TWO letters, A-E. Type one letter in each box.",
            ],
            choices: [
              { letter: "A", text: "provide certain kinds of information more directly" },
              { letter: "B", text: "distinguish between stories that have valid sources and those that don't" },
              { letter: "C", text: "recommend items that are appropriate for the user" },
              { letter: "D", text: "find sources quickly and efficiently" },
              { letter: "E", text: "find stories about famous people" },
            ],
            items: [
              { q: 35, text: "First answer" },
              { q: 36, text: "Second answer" },
            ],
          },
          {
            type: "sentenceGaps",
            title: "Questions 37-40",
            instructions: [
              "Complete the flow-chart below.",
              "Choose ONE WORD ONLY from the passage for each answer.",
            ],
            items: [
              { q: 37, text: "The news items become the", tail: "for algorithms to work with." },
              { q: 38, text: "A human editor", tail: "the stories collected by the algorithm." },
              { q: 39, text: "The human editor", tail: "content that is not suitable and replaces it." },
              { q: 40, text: "Selection by AI and humans can give a better standard of", tail: "." },
            ],
          },
        ],
      },
    ],
  },
};


const test9 = {
  listening: {
    audioSrc: "https://audio.ieltsmock.org/183.mp3",
    html: `
      <div class="listen-page" id="listenSec1">
        <div class="listen-block">
          <div class="listen-h">SECTION 1 - Questions 1-10</div>
          <div class="listen-card">
            <div class="listen-card-title">Questions 1-4</div>
            <div class="listen-inst">Complete the notes below. Write <b>ONE WORD ONLY</b> for each answer.</div>
            <div class="listen-card-title">Wayside Camera Club Membership Form</div>
            <div class="listen-notes">
              <div class="note-row">Name: Dan Green</div>
              <div class="note-row">Email address: dan1068@market.com</div>
              <div class="note-row">Home address: 52 <span class="qnum">1</span> <input data-lq="1" class="l-input"> Street, Peacetown</div>
              <div class="note-row">Heard about us: from a <span class="qnum">2</span> <input data-lq="2" class="l-input"></div>
              <div class="note-row">Reasons for joining: to enter competitions and to <span class="qnum">3</span> <input data-lq="3" class="l-input"></div>
              <div class="note-row">Type of membership: <span class="qnum">4</span> <input data-lq="4" class="l-input"> membership (£30)</div>
            </div>
          </div>
          <div class="listen-card">
            <div class="listen-card-title">Questions 5-10</div>
            <div class="listen-inst">Complete the table below. Write <b>NO MORE THAN TWO WORDS</b> for each answer.</div>
            <div class="listen-card-title">Photography competitions</div>
            <div class="listen-table-wrap">
              <table class="listen-table">
                <thead>
                  <tr>
                    <th>Title of competition</th>
                    <th>Instructions</th>
                    <th>Feedback to Dan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><div data-listening-question-host><span class="qnum">5</span> <input data-lq="5" class="l-input"></div></td>
                    <td>A scene in the home</td>
                    <td>The picture’s composition was not good</td>
                  </tr>
                  <tr>
                    <td>‘Beautiful Sunsets’</td>
                    <td><div data-listening-question-host>Scene must show some <span class="qnum">6</span> <input data-lq="6" class="l-input"></div></td>
                    <td><div data-listening-question-host>The <span class="qnum">7</span> <input data-lq="7" class="l-input"> was wrong</div></td>
                  </tr>
                  <tr>
                    <td><div data-listening-question-host><span class="qnum">8</span> <input data-lq="8" class="l-input"></div></td>
                    <td><div data-listening-question-host>Scene must show <span class="qnum">9</span> <input data-lq="9" class="l-input"></div></td>
                    <td><div data-listening-question-host>The photograph was too <span class="qnum">10</span> <input data-lq="10" class="l-input"></div></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="listen-page hidden" id="listenSec2">
        <div class="listen-block">
          <div class="listen-h">SECTION 2 - Questions 11-20</div>
          <div class="listen-card">
            <div class="listen-card-title">Questions 11 and 12</div>
            <div class="listen-inst">Choose <b>TWO</b> letters, <b>A-E</b>. Which TWO warnings does Dan give about picking mushrooms?</div>
            <label class="mcq-opt"><input type="checkbox" data-lq-check="11" value="A"> A) Don’t pick more than one variety of mushroom at a time.</label>
            <label class="mcq-opt"><input type="checkbox" data-lq-check="11" value="B"> B) Don’t pick mushrooms near busy roads.</label>
            <label class="mcq-opt"><input type="checkbox" data-lq-check="11" value="C"> C) Don’t eat mushrooms given to you.</label>
            <label class="mcq-opt"><input type="checkbox" data-lq-check="11" value="D"> D) Don’t eat mushrooms while picking them.</label>
            <label class="mcq-opt"><input type="checkbox" data-lq-check="11" value="E"> E) Don’t pick old mushrooms.</label>
          </div>
          <div class="listen-card">
            <div class="listen-card-title">Questions 13 and 14</div>
            <div class="listen-inst">Choose <b>TWO</b> letters, <b>A-E</b>. Which TWO ideas about wild mushrooms does Dan say are correct?</div>
            <label class="mcq-opt"><input type="checkbox" data-lq-check="13" value="A"> A) Mushrooms should always be peeled before eating.</label>
            <label class="mcq-opt"><input type="checkbox" data-lq-check="13" value="B"> B) Mushrooms eaten by animals may be unsafe.</label>
            <label class="mcq-opt"><input type="checkbox" data-lq-check="13" value="C"> C) Cooking destroys toxins in mushrooms.</label>
            <label class="mcq-opt"><input type="checkbox" data-lq-check="13" value="D"> D) Brightly coloured mushrooms can be edible.</label>
            <label class="mcq-opt"><input type="checkbox" data-lq-check="13" value="E"> E) All poisonous mushrooms have a bad smell.</label>
          </div>
          <div class="listen-card">
            <div class="listen-card-title">Questions 15-20</div>
            <div class="listen-inst">Choose the correct letter, <b>A, B or C</b>.</div>
            <div class="mcq"><div class="mcq-q"><span class="qnum">15</span> What advice does Dan give about picking mushrooms in parks?</div><label class="mcq-opt"><input type="radio" name="q15" value="A" data-lq-radio="15"> A) Choose wooded areas.</label><label class="mcq-opt"><input type="radio" name="q15" value="B" data-lq-radio="15"> B) Don’t disturb wildlife.</label><label class="mcq-opt"><input type="radio" name="q15" value="C" data-lq-radio="15"> C) Get there early.</label></div>
            <div class="mcq"><div class="mcq-q"><span class="qnum">16</span> Dan says it is a good idea for beginners to</div><label class="mcq-opt"><input type="radio" name="q16" value="A" data-lq-radio="16"> A) use a mushroom app.</label><label class="mcq-opt"><input type="radio" name="q16" value="B" data-lq-radio="16"> B) join a group.</label><label class="mcq-opt"><input type="radio" name="q16" value="C" data-lq-radio="16"> C) take a reference book.</label></div>
            <div class="mcq"><div class="mcq-q"><span class="qnum">17</span> What does Dan say is important for conservation?</div><label class="mcq-opt"><input type="radio" name="q17" value="A" data-lq-radio="17"> A) selecting only fully grown mushrooms</label><label class="mcq-opt"><input type="radio" name="q17" value="B" data-lq-radio="17"> B) picking a limited amount of mushrooms</label><label class="mcq-opt"><input type="radio" name="q17" value="C" data-lq-radio="17"> C) avoiding areas where rare mushroom species grow</label></div>
            <div class="mcq"><div class="mcq-q"><span class="qnum">18</span> According to Dan, some varieties of wild mushrooms are in decline because there is</div><label class="mcq-opt"><input type="radio" name="q18" value="A" data-lq-radio="18"> A) a huge demand for them from restaurants.</label><label class="mcq-opt"><input type="radio" name="q18" value="B" data-lq-radio="18"> B) a lack of rain in this part of the country.</label><label class="mcq-opt"><input type="radio" name="q18" value="C" data-lq-radio="18"> C) a rise in building developments locally.</label></div>
            <div class="mcq"><div class="mcq-q"><span class="qnum">19</span> Dan says that when storing mushrooms, people should</div><label class="mcq-opt"><input type="radio" name="q19" value="A" data-lq-radio="19"> A) keep them in the fridge for no more than two days.</label><label class="mcq-opt"><input type="radio" name="q19" value="B" data-lq-radio="19"> B) keep them in a brown bag in a dark room.</label><label class="mcq-opt"><input type="radio" name="q19" value="C" data-lq-radio="19"> C) leave them for a period after washing them.</label></div>
            <div class="mcq"><div class="mcq-q"><span class="qnum">20</span> What does Dan say about trying new varieties of mushrooms?</div><label class="mcq-opt"><input type="radio" name="q20" value="A" data-lq-radio="20"> A) Experiment with different recipes.</label><label class="mcq-opt"><input type="radio" name="q20" value="B" data-lq-radio="20"> B) Expect some to have a strong taste.</label><label class="mcq-opt"><input type="radio" name="q20" value="C" data-lq-radio="20"> C) Cook them for a long time.</label></div>
          </div>
        </div>
      </div>

      <div class="listen-page hidden" id="listenSec3">
        <div class="listen-block">
          <div class="listen-h">SECTION 3 - Questions 21-30</div>
          <div class="listen-card">
            <div class="listen-card-title">Questions 21 and 22</div>
            <div class="listen-inst">Choose <b>TWO</b> letters, <b>A-E</b>. Which TWO opinions about the Luddites do the students express?</div>
            <label class="mcq-opt"><input type="checkbox" data-lq-check="21" value="A"> A) Their actions were ineffective.</label>
            <label class="mcq-opt"><input type="checkbox" data-lq-check="21" value="B"> B) They are still influential today.</label>
            <label class="mcq-opt"><input type="checkbox" data-lq-check="21" value="C"> C) They have received unfair criticism.</label>
            <label class="mcq-opt"><input type="checkbox" data-lq-check="21" value="D"> D) They were proved right.</label>
            <label class="mcq-opt"><input type="checkbox" data-lq-check="21" value="E"> E) Their attitude is understandable.</label>
          </div>
          <div class="listen-card">
            <div class="listen-card-title">Questions 23 and 24</div>
            <div class="listen-inst">Choose <b>TWO</b> letters, <b>A-E</b>. Which TWO predictions about the future of work are the students doubtful about?</div>
            <label class="mcq-opt"><input type="checkbox" data-lq-check="23" value="A"> A) Work will be more rewarding.</label>
            <label class="mcq-opt"><input type="checkbox" data-lq-check="23" value="B"> B) Unemployment will fall.</label>
            <label class="mcq-opt"><input type="checkbox" data-lq-check="23" value="C"> C) People will want to delay retiring.</label>
            <label class="mcq-opt"><input type="checkbox" data-lq-check="23" value="D"> D) Working hours will be shorter.</label>
            <label class="mcq-opt"><input type="checkbox" data-lq-check="23" value="E"> E) People will change jobs more frequently.</label>
          </div>
          <div class="listen-card">
            <div class="listen-card-title">Questions 25-30</div>
            <div class="listen-inst">What comment do the students make about each of the following jobs? Choose <b>SIX</b> answers from the box and write the correct letter, <b>A-G</b>, next to Questions 25-30.</div>
            <div class="listen-notes">
              <div class="note-row"><b>Comments</b></div>
              <div class="note-row">A &nbsp; These jobs are likely to be at risk.</div>
              <div class="note-row">B &nbsp; Their role has become more interesting in recent years.</div>
              <div class="note-row">C &nbsp; The number of people working in this sector has fallen dramatically.</div>
              <div class="note-row">D &nbsp; This job will require more qualifications.</div>
              <div class="note-row">E &nbsp; Higher disposable income has led to a huge increase in jobs.</div>
              <div class="note-row">F &nbsp; There is likely to be a significant rise in demand for this service.</div>
              <div class="note-row">G &nbsp; Both employment and productivity have risen.</div>
              <div class="note-row"><b>Jobs</b></div>
              <div class="note-row" data-listening-question-host><span class="qnum">25</span> Accountants
                <select data-lq="25" class="l-select">
                  <option value=""></option><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option><option>F</option><option>G</option>
                </select>
              </div>
              <div class="note-row" data-listening-question-host><span class="qnum">26</span> Hairdressers
                <select data-lq="26" class="l-select">
                  <option value=""></option><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option><option>F</option><option>G</option>
                </select>
              </div>
              <div class="note-row" data-listening-question-host><span class="qnum">27</span> Administrative staff
                <select data-lq="27" class="l-select">
                  <option value=""></option><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option><option>F</option><option>G</option>
                </select>
              </div>
              <div class="note-row" data-listening-question-host><span class="qnum">28</span> Agricultural workers
                <select data-lq="28" class="l-select">
                  <option value=""></option><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option><option>F</option><option>G</option>
                </select>
              </div>
              <div class="note-row" data-listening-question-host><span class="qnum">29</span> Care workers
                <select data-lq="29" class="l-select">
                  <option value=""></option><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option><option>F</option><option>G</option>
                </select>
              </div>
              <div class="note-row" data-listening-question-host><span class="qnum">30</span> Bank clerks
                <select data-lq="30" class="l-select">
                  <option value=""></option><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option><option>F</option><option>G</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="listen-page hidden" id="listenSec4">
        <div class="listen-block">
          <div class="listen-h">SECTION 4 - Questions 31-40</div>
          <div class="listen-card">
            <div class="listen-card-title">Questions 31-40</div>
            <div class="listen-inst">Complete the notes below. Write <b>ONE WORD ONLY</b> for each answer.</div>
            <div class="listen-card-title">Space Traffic Management</div>
            <div class="listen-notes">
              <div class="note-row">A Space Traffic Management system would aim to set up legal and <span class="qnum">31</span> <input data-lq="31" class="l-input"> ways of improving safety.</div>
              <div class="note-row">Satellites are now quite <span class="qnum">32</span> <input data-lq="32" class="l-input"> and therefore more widespread.</div>
              <div class="note-row">There are constellations made up of <span class="qnum">33</span> <input data-lq="33" class="l-input"> of satellites.</div>
              <div class="note-row">At present, satellites are not required to transmit information to help with their <span class="qnum">34</span> <input data-lq="34" class="l-input"></div>
              <div class="note-row">There are few systems for <span class="qnum">35</span> <input data-lq="35" class="l-input"> satellites.</div>
              <div class="note-row">Operators may be unwilling to share details of satellites used for <span class="qnum">36</span> <input data-lq="36" class="l-input"> or commercial reasons.</div>
              <div class="note-row">It may be hard to collect details of the object’s <span class="qnum">37</span> <input data-lq="37" class="l-input"> at a given time.</div>
              <div class="note-row">Scientists can only make a <span class="qnum">38</span> <input data-lq="38" class="l-input"> about where the satellite will go.</div>
              <div class="note-row">The information should be combined in one <span class="qnum">39</span> <input data-lq="39" class="l-input"></div>
              <div class="note-row">A coordinated system must be designed to create <span class="qnum">40</span> <input data-lq="40" class="l-input"> in its users.</div>
            </div>
          </div>
        </div>
      </div>
    `,
  },
  writing: {
    task1Type: "Line graph",
    task2Type: "Agree or disagree",
    task1Html: `<p>The chart below gives information about European people of different age groups who went to the gym once a month or more between 1990 and 2010.</p>`,
    task1ImageSrc: "https://audio.ieltsmock.org/654416156_1285183377045727_339760894409887745_n.jpg",
    task2Html: `<p>Some people believe that not all students have a natural ability for learning other languages, so schools should not force them to learn new languages. To what extent do you agree or disagree?</p>`,
    samples: { task1: [], task2: [] },
  },
  reading: {
    parts: [
      {
        id: "part1",
        passageText: `Materials to take us beyond concrete

A
Concrete is the second most used substance in the global economy, after water – and one of the world’s biggest single sources of greenhouse gas emissions. The chemical process by which cement, the key ingredient of concrete, is created results in large quantities of carbon dioxide. The UN estimates that there will be 9.8 billion people living on the planet by mid-century. They will need somewhere to live. If concrete is the only answer to the construction of new cities, then carbon emissions will soar, aggravating global warming. And so scientists have started innovating with other materials, in a scramble for alternatives to a universal commodity that has underpinned our modern life for many years.

B
The problem with replacing concrete is that it is so very good at what it does. Chris Cheeseman, an engineering professor at Imperial College London, says the key thing to consider is the extent to which concrete is used around the world, and is likely to continue to be used. “Concrete is not a high-carbon product. Cement is high carbon, but concrete is not. But it is the scale on which it is used that makes it high carbon. The sheer scale of manufacture is so huge, that is the issue.”

C
Not only are the ingredients of concrete relatively cheap and found in abundance in most places around the globe, the stuff itself has marvellous properties: Portland cement, the vital component of concrete, is mouldable and pourable, but quickly sets hard. Cheeseman also notes another advantage: concrete and steel have similar thermal expansion properties, so steel can be used to reinforce concrete, making it far stronger and more flexible as a building material than it could be on its own. According to Cheeseman, all these factors together make concrete hard to beat. “Concrete is amazing stuff. Making anything with similar properties is going to be very difficult.”

D
A possible alternative to concrete is wood. Making buildings from wood may seem like a rather medieval idea, but climate change is driving architects to turn to treated timber as a possible resource. Recent years have seen the emergence of tall buildings constructed almost entirely from timber. Vancouver, Vienna and Brumunddal in Norway are all home to tall, wooden buildings.

E
Using wood to construct buildings, however, is not straightforward. Wood expands as it absorbs moisture from the air and is susceptible to pests, not to mention fire. But treating wood and combining it with other materials can improve its properties. Cross-laminated timber is engineered wood. An adhesive is used to stick layers of solid-sawn timber together, crosswise, to form building blocks. This material is light but has the strength of concrete and steel. Construction experts say that wooden buildings can be constructed at a greater speed than ones of concrete and steel and the process, it seems, is quieter.

F
Stora Enso is Europe’s biggest supplier of cross-laminated timber, and its vice-president Markus Mannstrom reports that the company is seeing increasing demand globally for building in wood, with climate change concerns the key driver. Finland, with its large forests, where Stora Enso is based, has been leading the way, but the company is seeing a rise in demand for its timber products across the world, including in Asia. Of course, using timber in a building also locks away the carbon that it absorbed as it grew. But even treated wood has its limitations and only when a wider range of construction projects has been proven in practice will it be possible to see wood as a real alternative to concrete in constructing tall buildings.

G
Fly ash and slag from iron ore are possible alternatives to cement in a concrete mix. Fly ash, a byproduct of coal-burning power plants, can be incorporated into concrete mixes to make up as much as 15 to 30% of the cement, without harming the strength or durability of the resulting mix. Iron-ore slag, a byproduct of the iron-ore smelting process, can be used in a similar way. Their incorporation into concrete mixes has the potential to reduce greenhouse gas emissions. But Anna Surgenor, of the UK’s Green Building Council, notes that although these waste products can save carbon in the concrete mix, their use is not always straightforward. “It’s possible to replace the cement content in concrete with waste products to lower the overall carbon impact. But there are several calculations that need to be considered across the entire life cycle of the building – these include factoring in where these materials are being shipped from. If they are transported over long distances, using fossil fuels, the use of alternative materials might not make sense from an overall carbon reduction perspective.”

H
While these technologies are all promising ideas, they are either unproven or based on materials that are not abundant. In their overview of innovation in the concrete industry, Felix Preston and Johanna Lehne of the UK’s Royal Institute of International Affairs reached the conclusion that, “Some novel cements have been discussed for more than a decade within the research community, without breaking through. At present, these alternatives are rarely as cost-effective as conventional cement, and they face raw-material shortages and resistance from customers.”`,
        blocks: [
          {
            type: "endingsMatch",
            title: "Questions 1-4",
            instructions: [
              "Reading Passage 1 has eight sections, A-H.",
              "Which section contains the following information?",
              "Write the correct letter, A-H, in the gaps.",
            ],
            endings: {
              A: "Section A", B: "Section B", C: "Section C", D: "Section D",
              E: "Section E", F: "Section F", G: "Section G", H: "Section H",
            },
            items: [
              { q: 1, text: "an explanation of the industrial processes that create potential raw materials for concrete" },
              { q: 2, text: "a reference to the various locations where high-rise wooden buildings can be found" },
              { q: 3, text: "an indication of how widely available the raw materials of concrete are" },
              { q: 4, text: "the belief that more high-rise wooden buildings are needed before wood can be regarded as a viable construction material" },
            ],
          },
          {
            type: "sentenceGaps",
            title: "Questions 5-8",
            instructions: [
              "Complete the summary below.",
              "Choose ONE WORD ONLY from the passage for each answer.",
            ],
            items: [
              { q: 5, text: "Current environmental concerns are encouraging", tail: " to use wood in modern construction projects." },
              { q: 6, text: "As", tail: " in the atmosphere enters wood, it increases in size." },
              { q: 7, text: "In one process,", tail: " of solid wood are glued together to create building blocks." },
              { q: 8, text: "Wooden buildings are an improvement in terms of the", tail: " with which they can be constructed." },
            ],
          },
          {
            type: "endingsMatch",
            title: "Questions 9-13",
            instructions: [
              "Match each statement with the correct person, A, B, C or D.",
              "You may use any letter more than once.",
            ],
            endings: {
              A: "Chris Cheeseman",
              B: "Markus Mannstrom",
              C: "Anna Surgenor",
              D: "Felix Preston and Johanna Lehne",
            },
            items: [
              { q: 9, text: "The environmental advantage of cement alternatives may not be as great as initially assumed." },
              { q: 10, text: "It would be hard to create a construction alternative to concrete that offers so many comparable benefits." },
              { q: 11, text: "Worries about the environment have led to increased interest in wood as a construction material." },
              { q: 12, text: "Expense has been a factor in the negative response to the development of new cements." },
              { q: 13, text: "The environmental damage caused by concrete is due to it being produced in large quantities." },
            ],
          },
        ],
      },
      {
        id: "part2",
        passageText: `The steam car

A
When primitive automobiles first began to appear in the 1800s, their engines were based on steam power. Steam had already enjoyed a long and successful career in the railways, so it was only natural that the technology evolved into a miniaturized version which was separate from the trains. But these early cars inherited steam’s weaknesses along with its strengths. The boilers had to be lit by hand, and they required about twenty minutes to build up pressure before they could be driven. Furthermore, their water reservoirs only lasted for about thirty miles before needing replenishment. Despite such shortcomings, these newly designed self-propelled carriages offered quick transportation, and by the early 1900s it was not uncommon to see such machines shuttling wealthy citizens around town.

B
But the glory days of steam cars were few. A new technology called the Internal Combustion Engine soon appeared, which offered the ability to drive down the road just moments after starting up. At first, these noisy gasoline cars were unpopular because they were more complicated to operate and they had difficult hand-crank starters, which were known to break arms when the engines backfired. But in 1912 General Motors introduced the electric starter, and over the following few years steam power was gradually phased out.

C
Even as the market was declining, four brothers made one last effort to rekindle the technology. Between 1906 and 1909, while still attending high school, Abner Doble and his three brothers built their first steam car in their parents’ basement. It comprised parts taken from a wrecked early steam car but reconfigured to drive an engine of their own design. Though it did not run well, the Doble brothers went on to build a second and third prototype in the following years. Though the Doble boys’ third prototype, nicknamed the Model B, still lacked the convenience of an internal combustion engine, it drew the attention of automobile trade magazines due to its numerous improvements over previous steam cars. The Model B proved to be superior to gasoline automobiles in many ways. Its high-pressure steam drove the engine pistons in virtual silence, in contrast to clattering gas engines which emitted the aroma of burned hydrocarbons. Perhaps most impressively, the Model B was amazingly swift. It could accelerate from zero to sixty miles per hour in just fifteen seconds, a feat described as “remarkable acceleration” by Automobile magazine in 1914.

D
The following year Abner Doble drove the Model B from Massachusetts to Detroit in order to seek investment in his automobile design, which he used to open the General Engineering Company. He and his brothers immediately began working on the Model C, which was intended to expand upon the innovations of the Model B. The brothers added features such as a key-based ignition in the cabin, eliminating the need for the operator to manually ignite the boiler. With these enhancements, the Dobles’ new car company promised a steam vehicle which would provide all of the convenience of a gasoline car, but with much greater speed, much simpler driving controls, and a virtually silent powerplant. By the following April, the General Engineering Company had received 5,390 deposits for Doble Detroits, which were scheduled for delivery in early 1918.

E
Later that year Abner Doble delivered unhappy news to those eagerly awaiting the delivery of their modern new cars. Those buyers who received the handful of completed cars complained that the vehicles were sluggish and erratic, sometimes going in reverse when they should go forward. The new engine design, though innovative, was still plagued with serious glitches.

F
The brothers made one final attempt to produce a viable steam automobile. In early 1924, the Doble brothers shipped a Model E to New York City to be road-tested by the Automobile Club of America. After sitting overnight in freezing temperatures, the car was pushed out into the road and left to sit for over an hour in the frosty morning air. At the turn of the key, the boiler lit and reached its operating pressure inside of forty seconds. As they drove the test vehicle further, they found that its evenly distributed weight lent it surprisingly good handling, even though it was so heavy. As the new Doble steamer was further developed and tested, its maximum speed was pushed to over a hundred miles per hour, and it achieved about fifteen miles per gallon of kerosene with negligible emissions.

G
Sadly, the Dobles’ brilliant steam car never was a financial success. Priced at around $18,000 in 1924, it was popular only among the very wealthy. Plus, it is said that no two Model Es were quite the same, because Abner Doble tinkered endlessly with the design. By the time the company folded in 1931, fewer than fifty of the amazing Model E steam cars had been produced. For his whole career, until his death in 1961, Abner Doble remained adamant that steam-powered automobiles were at least equal to gasoline cars, if not superior. Given the evidence, he may have been right. Many of the Model E Dobles which have survived are still in good working condition, some having been driven over half a million miles with only normal maintenance. Astonishingly, an unmodified Doble Model E runs clean enough to pass the emissions laws in California today, and they are pretty strict. It is true that the technology poses some difficult problems, but you cannot help but wonder how efficient a steam car might be with the benefit of modern materials and computers. Under the current pressure to improve automotive performance and reduce emissions, it is not unthinkable that the steam car may rise again.`,
        blocks: [
          {
            type: "headings",
            title: "Questions 14-20",
            instructions: [
              "Reading Passage 2 has seven paragraphs, A-G.",
              "Choose the correct heading for each paragraph from the list of headings below.",
            ],
            headings: [
              { value: "i", label: "A period in cold conditions before the technology is assessed" },
              { value: "ii", label: "Marketing issues lead to failure" },
              { value: "iii", label: "Good and bad aspects of steam technology are passed on" },
              { value: "iv", label: "A possible solution to the issues of today" },
              { value: "v", label: "Further improvements lead to commercial orders" },
              { value: "vi", label: "Positive publicity at last for this quiet, clean, fast vehicle" },
              { value: "vii", label: "A disappointing outcome for customers" },
              { value: "viii", label: "A better option than the steam car arises" },
            ],
            questions: [
              { q: 14, paragraph: "Paragraph A" },
              { q: 15, paragraph: "Paragraph B" },
              { q: 16, paragraph: "Paragraph C" },
              { q: 17, paragraph: "Paragraph D" },
              { q: 18, paragraph: "Paragraph E" },
              { q: 19, paragraph: "Paragraph F" },
              { q: 20, paragraph: "Paragraph G" },
            ],
          },
          {
            type: "mcq",
            title: "Questions 21-23",
            instructions: ["Choose the correct letter, A, B, C or D."],
            items: [
              { q: 21, text: "What point does the writer make about the steam car in Paragraph B?", choices: { A: "Its success was short-lived.", B: "Not enough cars were made.", C: "Car companies found them hard to sell.", D: "People found them hard to drive." } },
              { q: 22, text: "When building their first steam car, the Doble brothers", choices: { A: "constructed all the parts themselves.", B: "made written notes at each stage of the construction.", C: "needed several attempts to achieve a competitive model.", D: "sought the advice of experienced people in the car industry." } },
              { q: 23, text: "In order to produce the Model C, the Doble brothers", choices: { A: "moved production to a different city.", B: "raised financial capital.", C: "employed an additional worker.", D: "abandoned their earlier designs." } },
            ],
          },
          {
            type: "sentenceGaps",
            title: "Questions 24-26",
            instructions: [
              "Complete the summary below.",
              "Choose ONE WORD AND/OR A NUMBER from the passage for each answer.",
            ],
            items: [
              { q: 24, text: "A later version of the Model E raised its", tail: " while keeping its emissions extremely low." },
              { q: 25, text: "Under", tail: " cars were produced before the company went out of business." },
              { q: 26, text: "They satisfy California’s", tail: " emissions laws." },
            ],
          },
        ],
      },
      {
        id: "part3",
        passageText: `The case for mixed-ability classes

Picture this scene. It’s an English literature lesson in a UK school, and the teacher has just read an extract from Shakespeare’s Romeo and Juliet with a class of 15-year-olds. He’s given some of the students copies of No Fear Shakespeare, a kid-friendly translation of the original. For three students, even these literacy demands are beyond them. Another girl simply can’t focus and he gives her pens and paper to draw with. The teacher can ask the No Fear group to identify the key characters and maybe provide a tentative plot summary. He can ask most of the class about character development, and five of them might be able to support their statements with textual evidence. Now two curious students are wondering whether Shakespeare advocates living a life of moderation or one of passionate engagement.

As a teacher myself, I’d think my lesson would be going rather well if the discussion went as described above. But wouldn’t this kind of class work better if there weren’t such a huge gap between the top and the bottom? If we put all the kids who needed literacy support into one class, and all the students who want to discuss the virtue of moderation into another?

The practice of “streaming”, or “tracking”, involves separating students into classes depending on their diagnosed levels of attainment. At a macro level, it requires the establishment of academically selective schools for the brightest students, and comprehensive schools for the rest. Within schools, it means selecting students into a “stream” of general ability, or “sets” of subject-specific ability. The practice is intuitively appealing to almost every stakeholder.

I have heard the mixed-ability model attacked by way of analogy: a group hike. The fittest in the group take the lead and set a brisk pace, only to have to stop and wait every 20 minutes. This is frustrating, and their enthusiasm wanes. Meanwhile, the slowest ones are not only embarrassed but physically struggling to keep up. What’s worse, they never get a long enough break. They honestly just want to quit. Hiking, they feel, is not for them.

Mixed-ability classes bore students, frustrate parents and burn out teachers. The brightest ones will never summit Mount Qomolangma, and the stragglers won’t enjoy the lovely stroll in the park they are perhaps more suited to. Individuals suffer at the demands of the collective, mediocrity prevails. So: is learning like hiking?

The current pedagogical paradigm is arguably that of constructivism, which emerged out of the work of psychologist Lev Vygotsky. In the 1930s, Vygotsky emphasised the importance of targeting a student’s specific “zone of proximal development” (ZPD). This is the gap between what they can achieve only with support – teachers, textbooks, worked examples, parents and so on – and what they can achieve independently. The purpose of teaching is to provide and then gradually remove this “scaffolding” until they are autonomous. If we accept this model, it follows that streaming students with similar ZPDs would be an efficient and effective solution. And that forcing everyone on the same hike – regardless of aptitude – would be madness.

Despite all this, there is limited empirical evidence to suggest that streaming results in better outcomes for students. Professor John Hattie, director of the Melbourne Education Research Institute, notes that “tracking has minimal effects on learning outcomes”. What is more, streaming appears to significantly – and negatively – affect those students assigned to the lowest sets. These students tend to have much higher representation of low socioeconomic class. Less significant is the small benefit for those lucky clever students in the higher sets. The overall result is that the smart stay smart and the dumb get dumber, further entrenching the social divide.

In the latest update of Hattie’s influential meta-analysis of factors influencing student achievement, one of the most significant factors is the teachers’ estimate of achievement. Streaming students by diagnosed achievement automatically limits what the teacher feels the student is capable of. Meanwhile, in a mixed environment, teachers’ estimates need to be more diverse and flexible.

While streaming might seem to help teachers effectively target a student’s ZPD, it can underestimate the importance of peer-to-peer learning. A crucial aspect of constructivist theory is the role of the MKO – “more-knowledgeable other” – in knowledge construction. While teachers are traditionally the MKOs in classrooms, the value of knowledgeable student peers must not go unrecognised either.

I find it amazing to watch students get over an idea to their peers in ways that I would never think of. They operate with different language tools and different social tools from teachers and, having just learnt it themselves, they possess similar cognitive structures to their struggling classmates. There is also something exciting about passing on skills and knowledge that you yourself have just mastered – a certain pride and zeal, a certain freshness to the interaction between “teacher” and “learner” that is often lost by the expert for whom the steps are obvious and the joy of discovery forgotten.

Having a variety of different abilities in a collaborative learning environment provides valuable resources for helping students meet their learning needs, not to mention improving their communication and social skills. And today, more than ever, we need the many to flourish – not suffer at the expense of a few bright stars. Once a year, I go on a hike with my class, a mixed bunch of students. It is challenging. The fittest students realise they need to encourage the reluctant. There are lookouts who report back, and extra items to carry for others. We make it – together.`,
        blocks: [
          {
            type: "mcq",
            title: "Questions 27-30",
            instructions: ["Choose the correct letter, A, B, C or D."],
            items: [
              { q: 27, text: "The writer describes the Romeo and Juliet lesson in order to demonstrate", choices: { A: "how few students are interested in literature.", B: "how a teacher handles a range of learning needs.", C: "how unsuitable Shakespeare is for most teenagers.", D: "how weaker students can disrupt their classmates’ learning." } },
              { q: 28, text: "What does the writer say about streaming in the third paragraph?", choices: { A: "It has a very broad appeal.", B: "It favours cleverer students.", C: "It is relatively simple to implement.", D: "It works better in some schools than others." } },
              { q: 29, text: "What idea is suggested by the reference to Mount Qomolangma in the fifth paragraph?", choices: { A: "students following unsuitable paths", B: "students attempting interesting tasks", C: "students not achieving their full potential", D: "students not being aware of their limitations" } },
              { q: 30, text: "What does the word ‘scaffolding’ in the sixth paragraph refer to?", choices: { A: "the factors which prevent a student from learning effectively", B: "the environment where most of a student’s learning takes place", C: "the assistance given to a student in their initial stages of learning", D: "the setting of appropriate learning targets for a student’s aptitude" } },
            ],
          },
          {
            type: "summarySelect",
            title: "Questions 31-35",
            instructions: [
              "Complete the summary using the list of phrases, A-I, below.",
              "Write the correct letter, A-I, for each answer.",
            ],
            summaryTitle: "Is streaming effective?",
            summaryLines: [
              { text: "According to Professor John Hattie, there is very little indication that streaming leads to", blankQ: 31, tail: "." },
              { text: "The most significant impact is on those students placed in the", blankQ: 32, tail: "," },
              { text: "especially where a large proportion of them have", blankQ: 33, tail: "." },
              { text: "Meanwhile, for the", blankQ: 34, tail: ", there appears to be only minimal advantage." },
              { text: "A further issue is that teachers tend to have", blankQ: 35, tail: " of students in streamed groups." },
            ],
            optionsTitle: "List of phrases",
            options: [
              { letter: "A", word: "wrong classes" },
              { letter: "B", word: "lower expectations" },
              { letter: "C", word: "average learners" },
              { letter: "D", word: "bottom sets" },
              { letter: "E", word: "brightest pupils" },
              { letter: "F", word: "disadvantaged backgrounds" },
              { letter: "G", word: "weaker students" },
              { letter: "H", word: "higher achievements" },
              { letter: "I", word: "positive impressions" },
            ],
          },
          {
            type: "tfng",
            title: "Questions 36-40",
            instructions: [
              "Do the following statements agree with the views of the writer in Reading Passage 3?",
              "Write YES if the statement agrees with the views of the writer, NO if it contradicts the views, or NOT GIVEN if it is impossible to say.",
            ],
            yesNoMode: true,
            items: [
              { q: 36, text: "The Vygotsky model of education supports the concept of a mixed-ability class." },
              { q: 37, text: "Some teachers are uncertain about allowing students to take on MKO roles in the classroom." },
              { q: 38, text: "It can be rewarding to teach knowledge which you have only recently acquired." },
              { q: 39, text: "The priority should be to ensure that the highest-achieving students attain their goals." },
              { q: 40, text: "Taking part in collaborative outdoor activities with teachers and classmates can improve student outcomes in the classroom." },
            ],
          },
        ],
      },
    ],
  },
};

const test10 = {
  listening: {
    audioSrc: "https://audio.ieltsmock.org/Test10.mp3",
    html: `
      <div class="listen-page" id="listenSec1">
        <div class="listen-block">
          <div class="listen-h">SECTION 1 - Questions 1-10</div>

          <div class="listen-card">
            <div class="listen-card-title">Questions 1-6</div>
            <div class="listen-inst">Complete the notes. Write <b>ONE WORD AND/OR A NUMBER</b> for each answer.</div>
            <div class="listen-card-title">Colvin Lettings - notepad</div>
            <div class="listen-notes">
              <div class="note-row">Customer is looking for a 2-bed flat</div>
              <div class="note-row">Preferred locations:</div>
              <div class="note-row bullet">• the East Side</div>
              <div class="note-row bullet">• the Old <span class="qnum">1</span> <input data-lq="1" class="l-input small"></div>
              <div class="note-row">Needs it by <span class="qnum">2</span> <input data-lq="2" class="l-input"> at the latest</div>
              <div class="note-row">Budget: from £900 to <span class="qnum">3</span> £<input data-lq="3" class="l-input tiny"></div>
              <div class="note-row">Customer's name: Miss <span class="qnum">4</span> <input data-lq="4" class="l-input"></div>
              <div class="note-row">Tel: <span class="qnum">5</span> <input data-lq="5" class="l-input"></div>
              <div class="note-row">Email: <span class="qnum">6</span> <input data-lq="6" class="l-input"></div>
              <div class="note-row">Call her back later.</div>
            </div>
          </div>

          <div class="listen-card">
            <div class="listen-card-title">Questions 7-10</div>
            <div class="listen-inst">Complete the form. Write <b>ONE WORD AND/OR A NUMBER</b> for each answer.</div>
            <div class="listen-card-title">Three flats to rent</div>
            <div class="listen-table-wrap">
              <table class="listen-table">
                <thead>
                  <tr>
                    <th>Flat</th>
                    <th>Area / details</th>
                    <th>Availability / price</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    <td>a flat in the Old Port area<br>2 beds<br>has a big <span class="qnum">7</span> <input data-lq="7" class="l-input small"></td>
                    <td>available from the 12th<br>costs £1250 a month</td>
                  </tr>
                  <tr>
                    <td>2</td>
                    <td>a flat also in the Old Port area<br>one bed, but quite spacious</td>
                    <td>costs <span class="qnum">8</span> £<input data-lq="8" class="l-input tiny"> a month</td>
                  </tr>
                  <tr>
                    <td>3</td>
                    <td>in the <span class="qnum">9</span> <input data-lq="9" class="l-input small"> (down a side street)<br>2 beds<br>has a space for <span class="qnum">10</span> <input data-lq="10" class="l-input small"></td>
                    <td>£950 / month<br>available from the 11th</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="listen-page hidden" id="listenSec2">
        <div class="listen-block">
          <div class="listen-h">SECTION 2 - Questions 11-20</div>

          <div class="listen-card">
            <div class="listen-card-title">Questions 11-15</div>
            <div class="listen-inst">Choose the correct letter, <b>A</b>, <b>B</b>, or <b>C</b>.</div>
            <div class="mcq"><div class="mcq-q"><span class="qnum">11</span> How does Kevin feel about the amount of waste that is recycled in Bookwall?</div><label class="mcq-opt"><input type="radio" name="q11" value="A" data-lq-radio="11"> A) hopeful that it will start improving</label><label class="mcq-opt"><input type="radio" name="q11" value="B" data-lq-radio="11"> B) surprised that it is so high</label><label class="mcq-opt"><input type="radio" name="q11" value="C" data-lq-radio="11"> C) pleased with the progress that has been made</label></div>
            <div class="mcq"><div class="mcq-q"><span class="qnum">12</span> What point is Kevin making when he talks about drinks cans?</div><label class="mcq-opt"><input type="radio" name="q12" value="A" data-lq-radio="12"> A) People should ideally avoid buying canned drinks.</label><label class="mcq-opt"><input type="radio" name="q12" value="B" data-lq-radio="12"> B) Recycling an item uses less energy than making a new one would.</label><label class="mcq-opt"><input type="radio" name="q12" value="C" data-lq-radio="12"> C) Before buying a product, it is worth checking whether packaging can be recycled.</label></div>
            <div class="mcq"><div class="mcq-q"><span class="qnum">13</span> Kevin mentions ships in order to</div><label class="mcq-opt"><input type="radio" name="q13" value="A" data-lq-radio="13"> A) explain how much waste is produced.</label><label class="mcq-opt"><input type="radio" name="q13" value="B" data-lq-radio="13"> B) warn how dangerous rubbish in the sea can be.</label><label class="mcq-opt"><input type="radio" name="q13" value="C" data-lq-radio="13"> C) point out that a lot of the UK's rubbish is sent overseas.</label></div>
            <div class="mcq"><div class="mcq-q"><span class="qnum">14</span> What children's activity is being organised this year?</div><label class="mcq-opt"><input type="radio" name="q14" value="A" data-lq-radio="14"> A) making something out of recycled objects</label><label class="mcq-opt"><input type="radio" name="q14" value="B" data-lq-radio="14"> B) writing a story about recycling</label><label class="mcq-opt"><input type="radio" name="q14" value="C" data-lq-radio="14"> C) photographing people recycling</label></div>
            <div class="mcq"><div class="mcq-q"><span class="qnum">15</span> What does Kevin say about the recycling centres in Bookwall?</div><label class="mcq-opt"><input type="radio" name="q15" value="A" data-lq-radio="15"> A) They are easy to get to.</label><label class="mcq-opt"><input type="radio" name="q15" value="B" data-lq-radio="15"> B) Several new ones have recently opened.</label><label class="mcq-opt"><input type="radio" name="q15" value="C" data-lq-radio="15"> C) They are good places to learn about recycling.</label></div>
          </div>

          <div class="listen-card">
            <div class="listen-card-title">Questions 16-20</div>
            <div class="listen-inst">What should people do if they want to take each of the following items to a recycling centre? Write the appropriate letter, <b>A-C</b>, for each question.</div>
            <div class="people-box">
              <div><b>Actions</b></div>
              <div>A) make an appointment to visit</div>
              <div>B) bring it in any time</div>
              <div>C) check for further details before coming</div>
            </div>
            <div class="listen-notes">
              <div class="note-row"><b>Items</b></div>
              <div class="note-row" data-listening-question-host><span class="qnum">16</span> batteries <select data-lq="16" class="l-select"><option value=""></option><option>A</option><option>B</option><option>C</option></select></div>
              <div class="note-row" data-listening-question-host><span class="qnum">17</span> clothes <select data-lq="17" class="l-select"><option value=""></option><option>A</option><option>B</option><option>C</option></select></div>
              <div class="note-row" data-listening-question-host><span class="qnum">18</span> building materials <select data-lq="18" class="l-select"><option value=""></option><option>A</option><option>B</option><option>C</option></select></div>
              <div class="note-row" data-listening-question-host><span class="qnum">19</span> furniture <select data-lq="19" class="l-select"><option value=""></option><option>A</option><option>B</option><option>C</option></select></div>
              <div class="note-row" data-listening-question-host><span class="qnum">20</span> electronics <select data-lq="20" class="l-select"><option value=""></option><option>A</option><option>B</option><option>C</option></select></div>
            </div>
          </div>
        </div>
      </div>

      <div class="listen-page hidden" id="listenSec3">
        <div class="listen-block">
          <div class="listen-h">SECTION 3 - Questions 21-30</div>

          <div class="listen-card">
            <div class="listen-card-title">Questions 21 and 22</div>
            <div class="listen-inst">Choose <b>TWO</b> letters, <b>A-E</b>.</div>
            <div class="mcq-q">For which <b>TWO</b> reasons did <i>Sunrise Lake</i> become so popular?</div>
            <label class="mcq-opt"><input id="t10q21a" name="t10q21group" type="checkbox" data-lq-check="21" value="A" autocomplete="off"> A) Critics loved it.</label>
            <label class="mcq-opt"><input id="t10q21b" name="t10q21group" type="checkbox" data-lq-check="21" value="B" autocomplete="off"> B) It is brilliantly written.</label>
            <label class="mcq-opt"><input id="t10q21c" name="t10q21group" type="checkbox" data-lq-check="21" value="C" autocomplete="off"> C) It was marketed effectively.</label>
            <label class="mcq-opt"><input id="t10q21d" name="t10q21group" type="checkbox" data-lq-check="21" value="D" autocomplete="off"> D) Its writer was already a celebrity.</label>
            <label class="mcq-opt"><input id="t10q21e" name="t10q21group" type="checkbox" data-lq-check="21" value="E" autocomplete="off"> E) It was made into a successful film.</label>
          </div>

          <div class="listen-card">
            <div class="listen-card-title">Questions 23 and 24</div>
            <div class="listen-inst">Choose <b>TWO</b> letters, <b>A-E</b>.</div>
            <div class="mcq-q">What <b>TWO</b> questions about the novel do the students plan to address in the seminar?</div>
            <label class="mcq-opt"><input id="t10q23a" name="t10q23group" type="checkbox" data-lq-check="23" value="A" autocomplete="off"> A) what happens in the story</label>
            <label class="mcq-opt"><input id="t10q23b" name="t10q23group" type="checkbox" data-lq-check="23" value="B" autocomplete="off"> B) what makes the book unique</label>
            <label class="mcq-opt"><input id="t10q23c" name="t10q23group" type="checkbox" data-lq-check="23" value="C" autocomplete="off"> C) which other books it is similar to</label>
            <label class="mcq-opt"><input id="t10q23d" name="t10q23group" type="checkbox" data-lq-check="23" value="D" autocomplete="off"> D) why other students should read it</label>
            <label class="mcq-opt"><input id="t10q23e" name="t10q23group" type="checkbox" data-lq-check="23" value="E" autocomplete="off"> E) how they feel about the characters</label>
          </div>

          <div class="listen-card">
            <div class="listen-card-title">Questions 25 and 26</div>
            <div class="listen-inst">Choose <b>TWO</b> letters, <b>A-E</b>.</div>
            <div class="mcq-q">What <b>TWO</b> things do the students say can affect their mark for the seminar?</div>
            <label class="mcq-opt"><input id="t10q25a" name="t10q25group" type="checkbox" data-lq-check="25" value="A" autocomplete="off"> A) sticking to the time limit</label>
            <label class="mcq-opt"><input id="t10q25b" name="t10q25group" type="checkbox" data-lq-check="25" value="B" autocomplete="off"> B) preparing attractive slides</label>
            <label class="mcq-opt"><input id="t10q25c" name="t10q25group" type="checkbox" data-lq-check="25" value="C" autocomplete="off"> C) explaining the book's relevance nowadays</label>
            <label class="mcq-opt"><input id="t10q25d" name="t10q25group" type="checkbox" data-lq-check="25" value="D" autocomplete="off"> D) using quotations from the book effectively</label>
            <label class="mcq-opt"><input id="t10q25e" name="t10q25group" type="checkbox" data-lq-check="25" value="E" autocomplete="off"> E) responding well to their classmates' questions</label>
          </div>

          <div class="listen-card">
            <div class="listen-card-title">Questions 27-30</div>
            <div class="listen-inst">What comments do the students make about each of the following characters in <i>Sunrise Lake</i>? Write the appropriate letter, <b>A-E</b>, for each question.</div>
            <div class="people-box">
              <div><b>Comments</b></div>
              <div>A) She is intelligent.</div>
              <div>B) They feel sorry for her.</div>
              <div>C) They admire her determination.</div>
              <div>D) She creates difficulties for others.</div>
              <div>E) Her personality develops throughout the story.</div>
            </div>
            <div class="listen-notes">
              <div class="note-row" data-listening-question-host><span class="qnum">27</span> Betty <select data-lq="27" class="l-select"><option value=""></option><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option></select></div>
              <div class="note-row" data-listening-question-host><span class="qnum">28</span> Sally Baxter <select data-lq="28" class="l-select"><option value=""></option><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option></select></div>
              <div class="note-row" data-listening-question-host><span class="qnum">29</span> Mrs Dawson <select data-lq="29" class="l-select"><option value=""></option><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option></select></div>
              <div class="note-row" data-listening-question-host><span class="qnum">30</span> The cook <select data-lq="30" class="l-select"><option value=""></option><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option></select></div>
            </div>
          </div>
        </div>
      </div>

      <div class="listen-page hidden" id="listenSec4">
        <div class="listen-block">
          <div class="listen-h">SECTION 4 - Questions 31-40</div>

          <div class="listen-card">
            <div class="listen-card-title">Questions 31-35</div>
            <div class="listen-inst">Complete the notes below. Write <b>ONE WORD ONLY</b> for each answer.</div>
            <div class="listen-card-title">SWOT analysis</div>
            <div class="listen-notes">
              <div class="note-row">S-W-O-T analysis may have been the idea of Albert Humphrey, who wanted to explain why <span class="qnum">31</span> <input data-lq="31" class="l-input"> planning was not working.</div>
              <div class="note-row"><b>Definition of SWOT</b></div>
              <div class="note-row bullet">S = strengths, which give a business an advantage over others</div>
              <div class="note-row bullet">W = weaknesses, which give it a disadvantage</div>
              <div class="note-row bullet">O = opportunities, which a business could usefully <span class="qnum">32</span> <input data-lq="32" class="l-input small"></div>
              <div class="note-row bullet">T = threats, which may cause trouble</div>
              <div class="note-row"><b>Internal factors</b> (strengths and weaknesses)</div>
              <div class="note-row">Examples include:</div>
              <div class="note-row bullet">• what a firm sells</div>
              <div class="note-row bullet">• the price of its products or services</div>
              <div class="note-row bullet">• all the firm's <span class="qnum">33</span> <input data-lq="33" class="l-input small"></div>
              <div class="note-row bullet">• the firm's financial situation and output possibilities</div>
              <div class="note-row"><b>External factors</b> (opportunities and threats)</div>
              <div class="note-row">These are usually outside a company's control.</div>
              <div class="note-row">Understanding them can reduce a company's exposure to <span class="qnum">34</span> <input data-lq="34" class="l-input small"></div>
              <div class="note-row">Factors include:</div>
              <div class="note-row bullet">• activities of other businesses</div>
              <div class="note-row bullet">• changes in society and fashions</div>
              <div class="note-row bullet">• new <span class="qnum">35</span> <input data-lq="35" class="l-input small"> that are made</div>
              <div class="note-row bullet">• what happens in the marketplace</div>
            </div>
          </div>

          <div class="listen-card">
            <div class="listen-card-title">Questions 36-40</div>
            <div class="listen-inst">Complete the notes below. Write <b>ONE WORD ONLY</b> for each answer.</div>
            <div class="listen-notes">
              <div class="note-row"><b>Uses of SWOT analysis</b></div>
              <div class="note-row bullet">• for seeing what's changing in a particular area</div>
              <div class="note-row bullet">• for reviewing a business's strategy every <span class="qnum">36</span> <input data-lq="36" class="l-input small"></div>
              <div class="note-row bullet">• <span class="qnum">37</span> <input data-lq="37" class="l-input small"> departments of many companies do a SWOT analysis on their principal competitors</div>
              <div class="note-row bullet">• SWOT is a useful technique not only for profit-making companies, but also for <span class="qnum">38</span> <input data-lq="38" class="l-input small"></div>
              <div class="note-row bullet">• projects in the community</div>
              <div class="note-row bullet">• other non-profit groups</div>
              <div class="note-row"><b>Advantages of SWOT analysis</b></div>
              <div class="note-row">Conducting a SWOT is <span class="qnum">39</span> <input data-lq="39" class="l-input small">, as anyone can do it.</div>
              <div class="note-row">It improves a person's understanding of their organisation.</div>
              <div class="note-row"><b>Limitations of SWOT analysis</b></div>
              <div class="note-row">Because an effective analysis is quick, it's not a very detailed piece of research.</div>
              <div class="note-row">It's based on subjective judgement, and might not be consistent.</div>
              <div class="note-row">SWOT fails to take into consideration factors that might be particularly <span class="qnum">40</span> <input data-lq="40" class="l-input small"> in certain circumstances.</div>
            </div>
          </div>
        </div>
      </div>
    `,
  },
writing: {
  task1Type: "Map",
  task2Type: "Two-part question",
  task1Html: `
    You should spend about 20 minutes on this task.<br>
    The two maps below show the changes that have taken place in the town of Westley since 1815.<br>
    Summarise the information by selecting and reporting the main features, and make comparisons where relevant.<br>
    <b>Write at least 150 words.</b>
  `,
  task1ImageSrc: "https://audio.ieltsmock.org/Map10.png",
  task2Html: `
    You should spend about 40 minutes on this task.<br><br>
    Many people try to achieve success through their career or education.<br><br>
    What can success mean to different people?<br>
    What is your view of success?<br><br>
    Give reasons for your answer and include any relevant examples from your own knowledge or experience.<br>
    <b>Write at least 250 words.</b>
  `,
  samples: { task1: [], task2: [] },
},
  reading: {
    parts: [
      {
        id: "part1",
        passageText: `TO BEE OR NOT TO BEE?

A
The European honey bee is one of the most common bee species worldwide. Not only does it produce honey, it is also one of nature's most prolific pollinators. It is the single most important for agriculture due to its role in the growth of as much as a third of crops, although other bee species - around 250 in the UK and over 4000 in the US - also play their part in this process. Over recent years, however, reports of declining bee populations have increased, leaving concern surrounding the future of this incredibly important insect and its continuing role in providing the food we eat.

B
The European honey bee is thought to have originated in Africa or Asia, from where it spread throughout the Middle East and Europe and, with human assistance, is today present in every continent excluding Antarctica. Able to adapt to geographical surroundings and seasonal changes, the honey bee, unlike other species, benefits from perennial colonies that reproduce through the process of 'swarming'. During this process, up to half a colony's members will separate with the existing queen, leaving a successor behind to continue her work. Scout bees then search out a suitable location and the separated cluster relocates, forming a new colony.

C
Domestication of the species dates back as far as Ancient Egypt, evidenced in its depiction in tomb paintings. Today it remains one of the only insect species to be farmed, and is primarily chosen due to its honey-making virtues, its usefulness in pollination, and resistance to cold weather and disease. However, beekeepers sounded the alarm for the first time in 2006 reporting declining populations and abandoned hives, resulting in the terming of the syndrome known as Colony Collapse Disorder (CCD). The New York based National Resource Defense Council (NRDC) estimate that nearly one third of North America's bees have simply vanished since then, sending numbers plummeting to a fifty-year low. Additionally, the Intergovernmental Science-Policy Platform on Biodiversity and Ecosystem Services (IPBES), established under the UN in 2012, states that bees and butterflies are 'declining in abundance' across mainly Northwest Europe and North America, though other regions of the world are not escaping unscathed, and warns of the importance of protecting these species to ensure stable fruit and vegetable production, especially faced with a future in which we will have to feed ever-growing populations.

D
The consequences of a severely depleted honey bee population would be far-reaching. Considering our main staple crops such as rice, wheat and maize are wind-pollinated, and therefore not reliant on insects, we need not go hungry. However, we would lose essential nutrients from fruits, vegetables, nuts and oils were they to become no longer available or scarcer, potentially resulting in poor health for many. The IPBES cite 'more than three-quarters of the leading types of food crops' require animal pollination to some degree for both yield and quality. Economically speaking, global agricultural production reliant on bees and other insects is estimated at hundreds of billions of dollars a year. Lower yields through a dramatic reduction in pollinators would lead to higher prices for consumers and a serious dent in the profitability of the agriculture sector globally. To avoid this eventuality, research has been completed and more is underway to discover the cause of the phenomenon and possible solutions.

E
Yet that might be easier said than done, as the scientific consensus is that there is no one specific cause for CCD and the disappearance of bees. Many researchers believe a combination of factors is to blame. Global warming is causing changes in seasonal blooming, meaning bees may be missing important events in the agricultural calendar as, by the time they come out of hibernation, they arrive too late to pollinate crops. Pesticides are another probable cause. In 2016, an 18-year-long UK study concluded that some specific pesticides could be linked to 'large-scale population extinctions' of wild bees. Their use has been restricted or banned by the EU and parts of the US in response to this. Other suggested factors include a loss of habitat brought about by development of rural land, immunodeficiency in bees causing mass die-offs, GM crops, the use of antibiotics by beekeepers, and migratory beekeeping (the practice of moving hives around a country to aid pollination of crops), to mention just a few.

F
However, other voices in the field claim there is no bee crisis. Although they admit that CCD did challenge species in 2006, it is claimed that this is a centuries-old, periodic phenomenon from which bees recover. Some species, including the European honey bee, appear to be doing so and numbers are on the rise. These experts tell us we are worrying about the wrong bees. Those which are in danger of dying out are lesser known, wild species which, despite pollinating naturally, are not the domesticated honeybees we depend so greatly upon for our sustenance. While the extent of the bee decline is still under debate, for many it has served as a means of highlighting the delicate balance that exists in our ecosystem and the need for a greater understanding of agricultural sustainability.`,
        blocks: [
          {
            type: "headings",
            title: "Questions 1-5",
            instructions: [
              "The text has six paragraphs. Choose the correct heading for each paragraph.",
              "Write the appropriate number (i – ix).",
              "Example: Paragraph A — ix",
            ],
            headings: [
              { value: "i", label: "Falling figures" },
              { value: "ii", label: "Farming regulations" },
              { value: "iii", label: "Expanding populations" },
              { value: "iv", label: "Potential solutions" },
              { value: "v", label: "Questioning the claims" },
              { value: "vi", label: "The cost of collapse" },
              { value: "vii", label: "The end of the crisis" },
              { value: "viii", label: "The roots of the problem" },
              { value: "ix", label: "Worrying news" },
            ],
            questions: [
              { q: 1, paragraph: "Paragraph B" },
              { q: 2, paragraph: "Paragraph C" },
              { q: 3, paragraph: "Paragraph D" },
              { q: 4, paragraph: "Paragraph E" },
              { q: 5, paragraph: "Paragraph F" },
            ],
          },
          {
            type: "sentenceGaps",
            title: "Questions 6-9",
            instructions: [
              "Complete the notes.",
              "Use NO MORE THAN ONE WORD AND / OR A NUMBER from Reading Passage 1, To Bee or not to Bee.",
              "Write them in answer boxes 6-9.",
            ],
            inlineSections: [
              {
                heading: "Colony Collapse Disorder",
                lines: [
                  { bullet: true, segments: ["name arrived at due to reported issues in ", { q: 6 }, "."] },
                  { bullet: true, segments: ["bee numbers have fallen to their lowest in decades."] },
                  { bullet: true, segments: ["in addition to bees, ", { q: 7 }, " have also dramatically reduced in number in the US and parts of Europe."] },
                  { bullet: true, segments: ["these species needed for crops due to a continual increase in human populations."] },
                ],
              },
              {
                heading: "Reasons for Vanishing Bees",
                lines: [
                  { bullet: true, segments: ["climatic changes bring forward flowering of plants to when bees are still in ", { q: 8 }, "."] },
                  { bullet: true, segments: ["research shows mass ", { q: 9 }, " of non-domesticated bees could be due to pesticides."] },
                  { bullet: true, segments: ["genetically modified crops and the relocation of hives could be to blame."] },
                ],
              },
            ],
          },
          {
            type: "tfng",
            title: "Questions 10-13",
            instructions: [
              "Choose TRUE, FALSE or NOT GIVEN.",
            ],
            items: [
              { q: 10, text: "A significant fall in the number of animals able to transfer pollen to crops would be costly for both industry and individuals." },
              { q: 11, text: "Research into alternative methods of pollination has already turned up some potential causes of bees disappearing." },
              { q: 12, text: "Regularly moving bees to a different location can tackle CCD." },
              { q: 13, text: "The future of the honey bee is more certain than other types of bee." },
            ],
          },
        ],
      },
      {
        id: "part2",
        passageText: `Sleep Paralysis

Most nights, people experience dreams, partly due to a phase of the sleep cycle known as REM (Rapid Eye Movement) sleep, during which the brain is highly active and dreams are particularly vivid and complex. Throughout this state, our bodies are still except for the muscles needed to move the eyes and to breathe, perhaps in order to stop dreamers from acting out and being put in harm’s way. This almost complete paralysis is called atonia and is caused by motor neurons, small nerve endings located in the spinal cord. Although this is entirely normal during sleep, atonia can occur while a person is awake. This phenomenon is called sleep paralysis.

An infrequent but perfectly safe condition, during sleep paralysis the mind is awake but, due to atonia, the body is paralysed for up to several minutes. This can result in an inability to move or speak, a feeling of pressure on the chest, difficulty breathing and an inexplicable fear or feeling of dread. In some, the inability to move their eyes can occur, whereas others find that these are the only part of the body they can move. Many also experience hallucinations during sleep paralysis, varying from believing a malevolent presence to be in the room, to more complex hallucinations including hearing, smelling or feeling things that are not there. In more extreme cases, people have reported forced or wilful out-of-body experiences. Understandably, these effects can be very frightening for the individual, even though there is no danger.

Documented interest in sleep paralysis goes back as far as Ancient Greece, but has not always been thought of as a medical issue. Paulus Aegenita, a Byzantine Greek physician, wrote about a disorder called ‘ephialtes’ in his medical encyclopaedia Medical Compendium in Seven Books. According to Paulus, the sufferer of ephialtes experiences the sensation of being suffocated and unable to move as a demon presses down on them. The being may speak while attempting to suffocate them, then flees when they strive to grab it. Aegenita believed such an affliction was a forerunner of another disease and that the demon behind it would return every night after its initial visit to torment the sleeper. This perception of sleep paralysis is mirrored across many cultures. British folklore talks of the Old Hag, an entity who sits on people’s chests while they sleep and causes them to have nightmares. When the sleeper awakes, the Old Hag disappears, leaving the person unable to speak or move temporarily. The Old Hag also appears in other European cultures, commonly known as ‘mara’ and causing similar effects on its victims.

Beyond these broad similarities, further details differ from culture to culture. In Japan, evil spirits - known as ‘kanashibari’ - tie up victims with iron ropes, whereas the Inuits attribute the phenomena to a shaman placing a curse upon the victim. Despite these differences, it is clear that most pre-Enlightenment cultures believed that rather than a natural occurrence in the human body, sleep paralysis was attributed to an exterior threat, someone or something that wished to harm them. 18th-Century artist Henry Fuseli is well known for oil painting ‘The Nightmare’, depicting a woman with a demonic creature sitting on her chest and a possessed horse skulking near the bed. This painting is commonly perceived as depicting sleep paralysis, as the incubus puts pressure on the chest, causing the shortness of breath typical of the condition. Furthermore, the woman is painted as lying on her back, a position which even in modern medicine is considered to lead to or exacerbate sleep paralysis. It is believed that Fuseli was inspired by Germanic tales of hags and mara in his creation of this artwork.

Given that people in the past attributed sleep paralysis to supernatural causes, it is unsurprising that they also believed it was a precursor to illness or could even lead to death. Even when a rational, medical explanation for the condition exists, some people still believe it is more than just an anomaly in sleeping patterns. Some theories attribute sleep paralysis to ‘shadow people’ - entities with a human form found in the shadows watching over victims while they sleep. Those who have ‘met’ these gloomy figures, often hallucinate about long shadows and strange shapes. The widely documented nature of these hallucinations mean many consider them proof of the shadow people’s existence. Alternatively, many conspiracy theorists believe sleep paralysis is due to alien activity, as the majority of those claiming to be victims of alien abduction describe the encounter as being similar to sleep paralysis: inexplicable anxiety, hearing buzzing or humming sounds and sensing a potentially harmful presence.

It appears some aspect of the human psyche has always been attracted to bizarre and supernatural explanations for an affliction that, although potentially alarming, is entirely benign. Although the mechanics are now understood by modern medicine, the root causes of sleep paralysis still remain vague and unconfirmed. It has been linked to narcolepsy, its likelihood increasing through irregular sleeping patterns or insomnia. Nonetheless, a definitive cause has yet to be determined and this strange phenomenon is likely to continue to attract supernatural speculation until we discover what exactly provokes it.`,
        blocks: [
          {
            type: "multiTextChoices",
            title: "Questions 14-16",
            instructions: [
              "Choose THREE letters (from A–G).",
              "According to the passage, what is true of normal REM sleep?",
            ],
            choices: [
              { letter: "A", text: "Our eyes can be sometimes open." },
              { letter: "B", text: "We only dream if we are completely free from harm." },
              { letter: "C", text: "All but the most essential muscles do not function." },
              { letter: "D", text: "Our bodies attempt to act out our dreams." },
              { letter: "E", text: "Our dreams are more animated." },
              { letter: "F", text: "Motor neurons in the spinal cord cause a condition called atonia." },
              { letter: "G", text: "Atonia can cause sleepers to wake up." },
            ],
            items: [
              { q: 14, text: "First answer" },
              { q: 15, text: "Second answer" },
              { q: 16, text: "Third answer" },
            ],
          },
          {
            type: "multiTextChoices",
            title: "Questions 17-19",
            instructions: [
              "Choose THREE letters (from A–G).",
              "What can happen to people during an attack of sleep paralysis?",
            ],
            choices: [
              { letter: "A", text: "Their minds suddenly go to sleep." },
              { letter: "B", text: "They sense something pushing on their body." },
              { letter: "C", text: "They often feel afraid for no reason." },
              { letter: "D", text: "They experience physical pain." },
              { letter: "E", text: "They are able to move their eyes." },
              { letter: "F", text: "Their bodies develop a strange smell." },
              { letter: "G", text: "They sense things which are not present." },
            ],
            items: [
              { q: 17, text: "First answer" },
              { q: 18, text: "Second answer" },
              { q: 19, text: "Third answer" },
            ],
          },
          {
            type: "endingsMatch",
            title: "Questions 20-25",
            instructions: [
              "Choose the correct figure(s).",
            ],
            endings: {
              CT: "Conspiracy theorists",
              HF: "Henry Fuseli",
              OH: "The Old Hag",
              PA: "Paulus Aegenita",
              SP: "Shadow People",
            },
            items: [
              { q: 20, text: "Can draw parallels between a personal experience and the symptoms of sleep paralysis." },
              { q: 21, text: "Believed sleep paralysis to be a sign of underlying health problems." },
              { q: 22, text: "Can be referred to by an alternative name depending on which country you are in." },
              { q: 23, text: "Is/are believed by many to exist due to the extensive recording of visions." },
              { q: 24, text: "Received inspiration from folklore." },
              { q: 25, text: "Is/are thought to cause bad dreams." },
            ],
          },
          {
            type: "mcq",
            title: "Question 26",
            instructions: ["Choose the correct answer."],
            items: [
              { q: 26, text: "What is the most appropriate title for this text?", choices: { A: "The role of folklore in dreams.", B: "The physical symptoms and effects of sleep paralysis.", C: "Investigating the source of irregular sleep patterns.", D: "Paranormal theories for an unexplained phenomenon." } },
            ],
          },
        ],
      },
      {
        id: "part3",
        passageText: `The Antikythera Mechanism

One spring day in 1900, a party of Greek sponge divers took shelter from a storm near the island of Antikythera, which lies about 50 kilometres northwest of the western tip of Crete. After the storm, one of the group, Elias Stadiatis, decided to dive in search of giant clams to eat for their dinner. On a shelf about 43 metres below the surface of the water, he chanced upon the wreck of an ancient ship. Fragments of statues, looking like body parts, covered this ledge. The diver returned to the surface, bearing an arm made of bronze as proof of what he had discovered. He reported his find to the authorities and, in the autumn, he and his companions returned to dive on the Antikythera wreck on behalf of the Greek government. They spent the next ten months bringing up pieces of marble and bronze statues, amphorae, lamps and coins, all of which were sent to the National Museum in Athens for cleaning and restoration.

Among the artefacts retrieved from the shipwreck was a rather unprepossessing lump of bronze inside what seemed to be a wooden casing. This object was covered in barnacles and badly corroded by seawater, and didn’t attract much attention at first. It wasn’t until May 1902 that the leading Greek archaeologist Valerios Stais noticed that the wooden covering had dried out and split open, and the fused lump of metal inside it had separated into several pieces. The largest of these fragments was a dial about 14cm in diameter, with some inscriptions on it. Some other fragments also appeared to be parts of dials with perfectly formed triangular teeth, like gear wheels. The evidence seemed to point to this being part of a kind of mechanical clock, but the researchers ultimately rejected this possibility as the wreck had been dated to the first century BCE, and it was known that precise gears like these had not existed until fourteen centuries after that.

Little progress on identifying either the purpose or origins of the mechanism was made until the late 1950s, when the device attracted the attention of a British-born polymath, Derek de Solla Price, who was working at Princeton University in the United States. Price realised that the inscriptions on the large dial indicated days, months and zodiac signs and theorised that the device used gears to trace the paths of the sun, moon and other planets in relation to the earth and to indicate their position at any given moment by means of pointers that had since been lost. Although his interpretation was basically sound, further research was hampered by the fact that only a few of the gears appear on the surface of the fused metal fragments of the mechanism.

In 1971, the National Museum in Athens gave permission for Price, working with a Greek radiographer, to X-ray the fragments of the Antikythera mechanism. These two-dimensional images revealed many of the hidden gears and allowed Price to develop schematic drawings of how the mechanism must have worked. What he discovered confounded all previous theories of technology in the Hellenistic era and indicated that the ancient Greeks’ mechanical know-how and knowledge of astronomy came close to that of modern times. However, despite positive scholarly reviews of Price’s work, his idea that the Antikythera mechanism is an ancient analogue computer, published in his 1974 book “Gears from the Greeks”, fell on deaf ears where mainstream historians were concerned. This may have been due, at least in part, to the contemporaneous popularity of books by the Swiss writer Erich von Daniken, who postulated that ancient aliens had brought advanced technology to earth; Price’s work may have inadvertently become associated with fringe theories and UFO-hunters as a result.

Whatever the reason, little more official research was conducted on the mechanism until the 2005 launch of the Antikythera Mechanism Research Project, an international, multi-disciplinary study that operates under the supervision of the Hellenic Ministry of Culture. The project examined the fragments of the Antikythera mechanism using state-of-the-art imaging equipment. One machine, nicknamed BladeRunner, was originally designed to detect cracks in aircraft turbine blades by means of three-dimensional X-ray technology. This project is ongoing and new findings are being constantly made and revealed. Enough has already been discovered to vindicate Price.

This modern research places the construction of the mechanism towards the end of the second century BCE and confirms that its bronze dials and gears would have been housed in a wooden box roughly the size of a modern shoebox. Like the clocks our grandparents’ generation kept on the mantelpiece, the mechanism had a circular dial at the front with rotating hands. Rather than showing hours and minutes, however, these hands indicated the exact whereabouts of the sun and the moon in the sky at any given time, as well as of Mercury, Venus, Mars, Jupiter and Saturn, the five planets that are visible to the naked human eye. In addition, the mechanism also allowed for the fact that the orbit of some planets around the sun appears to go backwards, or “retrograde”, at certain times during the celestial cycle.

It has also been discovered that there were two dials on the back of the mechanism, one of which was a calendar and the other which showed when solar and lunar eclipses would take place. A number of breathtaking models of the mechanism have been produced, including one made out of Lego blocks. These reveal the outstanding mechanical skills and astronomical knowledge of whoever built the Antikythera mechanism two thousand years or more before we developed the technological skills to start unlocking its secrets.`,
        blocks: [
          {
            type: "sentenceGaps",
            title: "Questions 27-32",
            instructions: [
              "Complete the summary.",
              "Use NO MORE THAN THREE WORDS from Reading Passage 3, The Antikythera Mechanism, for each answer.",
              "Write them in answer boxes 27-32.",
            ],
            inlineSections: [
              {
                heading: "The Discovery of the Antikythera Mechanism",
                lines: [
                  { segments: ["The Antikythera mechanism was discovered by a diver who was looking for ", { q: 27 }, ". Instead, he found the remains of an ancient ship, from which he took proof to show his fellow divers."] },
                  { segments: ["Having been commissioned to recover the relics, the same divers spent ", { q: 28 }, " retrieving items such as sculptures made of ", { q: 29 }, " for the National Museum. Another item they found was a ", { q: 30 }, " which contained a piece of metal."] },
                  { segments: ["This was ignored until over a year later when a renowned archaeologist noticed that the inside was composed of several pieces, one of which had ", { q: 31 }, " on it, and others appeared to be apparatus of some sort, leading the investigators to think at first that the artefact might have been a ", { q: 32 }, ", although the historical origin of it suggested this was impossible."] },
                ],
              },
            ],
          },
          {
            type: "endingsMatch",
            title: "Questions 33-37",
            instructions: [
              "Complete each sentence with the correct ending.",
              "Write the appropriate letters, A-H.",
            ],
            endings: {
              A: "... to calculate how the calendar operated.",
              B: "... to identify problems in aeronautical components.",
              C: "... to discover historical artifacts.",
              D: "... to link the ancient device to theories about extra terrestrials.",
              E: "... to use gears to calculate astronomical movements.",
              F: "... to discover that there was more to the mechanism than first thought.",
              G: "... to create a visual representation of the inside of the mechanism.",
              H: "... to retrieve the outstanding relics.",
            },
            items: [
              { q: 33, text: "Elias Stadiatis had not intended" },
              { q: 34, text: "The group of divers were asked" },
              { q: 35, text: "Valerios Stais was the first" },
              { q: 36, text: "Derek de Solla Price first managed" },
              { q: 37, text: "The Antikythera Mechanism Research Project used technology originally created" },
            ],
          },
          {
            type: "mcq",
            title: "Questions 38-40",
            instructions: ["Choose the correct answer. Write the appropriate letter A-D for each question."],
            items: [
              { q: 38, text: "How is the mechanism similar to more contemporary clock designs?", choices: { A: "It has a small, box shape.", B: "The casing is made of wood.", C: "It has hands which turn around in a circle.", D: "It indicates how many minutes and hours have passed." } },
              { q: 39, text: "Which of the following does the Antikythera mechanism NOT display to an observer?", choices: { A: "The current position of the moon in the sky.", B: "Where to look if you want to see Jupiter at night.", C: "The number of moons belonging to Mars.", D: "The date of the next lunar eclipse." } },
              { q: 40, text: "What do our current models of the mechanism show?", choices: { A: "The mechanism is so advanced in design, we couldn’t understand it until modern times.", B: "The creators of the Antikythera mechanism knew far more about astronomy than we do.", C: "We have only recently possessed the technology that belonged to the ancient Greeks.", D: "There are still things we don’t understand about the Antikythera mechanism." } },
            ],
          },
        ],
      },
    ],
  },
};

const test11 = {
  listening: {
    audioSrc: "https://audio.ieltsmock.org/Listening1.mp3",
    html: `
<div class="listen-page" id="listenSec1">
  <div class="listen-block">
    <div class="listen-h">PART 1 - QUESTIONS 1-10</div>

    <div class="listen-card">
      <div class="listen-card-title">Questions 1-5</div>
      <div class="listen-inst">Complete the form below. Write <b>NO MORE THAN TWO WORDS AND / OR LETTERS AND NUMBERS</b> for each answer.</div>
      <div class="listen-card-title">Pan Asian Airways - Lost Property Report Form</div>

      <div class="listen-notes">
        <div class="note-row">First Name: Kirsty</div>
        <div class="note-row">Surname: Allen</div>
        <div class="note-row">Address: <span class="qnum">1</span> <input data-lq="1" class="l-input"> Windham Road</div>
        <div class="note-row">Richmond</div>
        <div class="note-row">Postcode: <span class="qnum">2</span> <input data-lq="2" class="l-input"></div>
        <div class="note-row">Home tel: 020 8927 7651</div>
        <div class="note-row">Mobile tel: <span class="qnum">3</span> <input data-lq="3" class="l-input"></div>
        <div class="note-row">Flight number: <span class="qnum">4</span> <input data-lq="4" class="l-input"></div>
        <div class="note-row">Seat number: <span class="qnum">5</span> <input data-lq="5" class="l-input"></div>
        <div class="note-row">From: New York</div>
        <div class="note-row">To: London Heathrow</div>
      </div>
    </div>

    <div class="listen-card">
      <div class="listen-card-title">Questions 6-8</div>
      <div class="listen-inst">Choose <b>THREE</b> letters, A-F.</div>
      <div class="listen-card-title">What THREE items did Kirsty’s bag contain?</div>

      <label class="mcq-opt"><input type="checkbox" data-lq-check="6" value="A"> A) £17</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="6" value="B"> B) $200</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="6" value="C"> C) Her passport</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="6" value="D"> D) A book</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="6" value="E"> E) Pens</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="6" value="F"> F) Her house keys</label>
    </div>

    <div class="listen-card">
      <div class="listen-card-title">Questions 9-10</div>
      <div class="listen-inst">Choose the correct letter, <b>A, B, or C</b>.</div>

      <div class="mcq">
        <div class="mcq-q"><span class="qnum">9</span> What has Kirsty done regarding the loss of her credit card?</div>
        <label class="mcq-opt"><input type="radio" name="q9" value="A" data-lq-radio="9"> A) Informed the police but not the credit card company.</label>
        <label class="mcq-opt"><input type="radio" name="q9" value="B" data-lq-radio="9"> B) Informed the credit card company but not the police.</label>
        <label class="mcq-opt"><input type="radio" name="q9" value="C" data-lq-radio="9"> C) Informed both the police and the credit card company.</label>
      </div>

      <div class="mcq">
        <div class="mcq-q"><span class="qnum">10</span> What must Kirsty do after the call regarding her lost handbag?</div>
        <label class="mcq-opt"><input type="radio" name="q10" value="A" data-lq-radio="10"> A) Call back after 1½ hours.</label>
        <label class="mcq-opt"><input type="radio" name="q10" value="B" data-lq-radio="10"> B) Just wait for a call back.</label>
        <label class="mcq-opt"><input type="radio" name="q10" value="C" data-lq-radio="10"> C) Call back after 1½ hours if she has heard nothing.</label>
      </div>
    </div>
  </div>
</div>

<div class="listen-page hidden" id="listenSec2">
  <div class="listen-block">
    <div class="listen-h">PART 2 - QUESTIONS 11-20</div>

    <div class="listen-card">
      <div class="listen-card-title">Questions 11-14</div>
      <div class="listen-inst">Label the map below. Write the correct letter, <b>A-F</b>, next to each question.</div>

      <div style="margin: 14px 0; display:flex; justify-content:center;">
  <img
    src="https://audio.ieltsmock.org/Screenshot%202026-04-15%20at%2013.43.12.png"
    alt="University of Westley map"
    style="max-width:100%; width:430px; height:auto; border:1px solid #ccc; border-radius:8px;"
  >
</div>

      <div class="note-row"><span class="qnum">11</span> Students' Union
        <select class="l-select" data-lq="11">
          <option value=""></option><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option><option>F</option>
        </select>
      </div>
      <div class="note-row"><span class="qnum">12</span> Library
        <select class="l-select" data-lq="12">
          <option value=""></option><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option><option>F</option>
        </select>
      </div>
      <div class="note-row"><span class="qnum">13</span> Refectory
        <select class="l-select" data-lq="13">
          <option value=""></option><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option><option>F</option>
        </select>
      </div>
      <div class="note-row"><span class="qnum">14</span> Sports hall
        <select class="l-select" data-lq="14">
          <option value=""></option><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option><option>F</option>
        </select>
      </div>
    </div>

    <div class="listen-card">
      <div class="listen-card-title">Questions 15-16</div>
      <div class="listen-inst">Choose <b>TWO</b> letters, A-E.</div>
      <div class="listen-card-title">Which TWO of the following are true of the Students' Union building?</div>

      <label class="mcq-opt"><input type="checkbox" data-lq-check="15" value="A"> A) You need to be a member to access its facilities.</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="15" value="B"> B) All eating and drinking facilities are located on the same floor.</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="15" value="C"> C) It is a good place to go if you want to find out about joining student groups or clubs.</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="15" value="D"> D) You can play football there.</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="15" value="E"> E) It always closes at the same time.</label>
    </div>

    <div class="listen-card">
      <div class="listen-card-title">Questions 17-18</div>
      <div class="listen-inst">Choose <b>TWO</b> letters, A-E.</div>
      <div class="listen-card-title">Which TWO of the following does the guide say about the library?</div>

      <label class="mcq-opt"><input type="checkbox" data-lq-check="17" value="A"> A) Students can get part-time work there.</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="17" value="B"> B) It is the main reason most students chose to come to the university.</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="17" value="C"> C) Students should visit it as soon as possible.</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="17" value="D"> D) Students can have tours of it throughout the year.</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="17" value="E"> E) It has different opening hours at certain times of the year.</label>
    </div>

    <div class="listen-card">
      <div class="listen-card-title">Questions 19-20</div>
      <div class="listen-inst">Choose <b>TWO</b> letters, A-E.</div>
      <div class="listen-card-title">Which TWO of the following are true of the university sports hall?</div>

      <label class="mcq-opt"><input type="checkbox" data-lq-check="19" value="A"> A) It is the newest building at the university.</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="19" value="B"> B) It is very popular.</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="19" value="C"> C) You need to pay extra to use it.</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="19" value="D"> D) You can get a map there.</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="19" value="E"> E) You can use your discount card there.</label>
    </div>
  </div>
</div>

<div class="listen-page hidden" id="listenSec3">
  <div class="listen-block">
    <div class="listen-h">PART 3 - QUESTIONS 21-30</div>

    <div class="listen-card">
      <div class="listen-card-title">Questions 21-25</div>
      <div class="listen-inst">Choose the correct letter, <b>A, B, or C</b>.</div>

      <div class="mcq">
        <div class="mcq-q"><span class="qnum">21</span> Why did John come back to university on Thursday?</div>
        <label class="mcq-opt"><input type="radio" name="q21" value="A" data-lq-radio="21"> A) To prepare for new second year subjects</label>
        <label class="mcq-opt"><input type="radio" name="q21" value="B" data-lq-radio="21"> B) To sort out his timetable</label>
        <label class="mcq-opt"><input type="radio" name="q21" value="C" data-lq-radio="21"> C) To speak to his tutor about his workload</label>
      </div>

      <div class="mcq">
        <div class="mcq-q"><span class="qnum">22</span> Which subject do John and Jane both study?</div>
        <label class="mcq-opt"><input type="radio" name="q22" value="A" data-lq-radio="22"> A) History</label>
        <label class="mcq-opt"><input type="radio" name="q22" value="B" data-lq-radio="22"> B) Maths</label>
        <label class="mcq-opt"><input type="radio" name="q22" value="C" data-lq-radio="22"> C) Economics</label>
      </div>

      <div class="mcq">
        <div class="mcq-q"><span class="qnum">23</span> Which statement about their Monday timetables is true?</div>
        <label class="mcq-opt"><input type="radio" name="q23" value="A" data-lq-radio="23"> A) John will be busier than Jane.</label>
        <label class="mcq-opt"><input type="radio" name="q23" value="B" data-lq-radio="23"> B) Jane will be busier than John.</label>
        <label class="mcq-opt"><input type="radio" name="q23" value="C" data-lq-radio="23"> C) They will be equally busy.</label>
      </div>

      <div class="mcq">
        <div class="mcq-q"><span class="qnum">24</span> John can't attend his preferred club until</div>
        <label class="mcq-opt"><input type="radio" name="q24" value="A" data-lq-radio="24"> A) they buy new boots.</label>
        <label class="mcq-opt"><input type="radio" name="q24" value="B" data-lq-radio="24"> B) they repair the equipment.</label>
        <label class="mcq-opt"><input type="radio" name="q24" value="C" data-lq-radio="24"> C) they lower the price of membership.</label>
      </div>

      <div class="mcq">
        <div class="mcq-q"><span class="qnum">25</span> Which one of the following is mentioned about Jane and John's sport choices?</div>
        <label class="mcq-opt"><input type="radio" name="q25" value="A" data-lq-radio="25"> A) They have chosen the same sport.</label>
        <label class="mcq-opt"><input type="radio" name="q25" value="B" data-lq-radio="25"> B) The sports they have chosen share a venue.</label>
        <label class="mcq-opt"><input type="radio" name="q25" value="C" data-lq-radio="25"> C) The sports they have chosen take place at the same time.</label>
      </div>
    </div>

    <div class="listen-card">
      <div class="listen-card-title">Questions 26-29</div>
      <div class="listen-inst">Answer the questions. Use <b>NO MORE THAN THREE WORDS AND / OR A NUMBER</b> for each answer.</div>

      <div class="note-row"><span class="qnum">26</span> Students can choose from how many essay titles for their first assignment?
        <input data-lq="26" class="l-input">
      </div>
      <div class="note-row"><span class="qnum">27</span> What is ONE of the places John travelled during the summer?
        <input data-lq="27" class="l-input">
      </div>
      <div class="note-row"><span class="qnum">28</span> How many words longer are essays expected to be this year?
        <input data-lq="28" class="l-input">
      </div>
      <div class="note-row"><span class="qnum">29</span> When must the first essay be handed in by?
        <input data-lq="29" class="l-input">
      </div>
    </div>

    <div class="listen-card">
      <div class="listen-card-title">Question 30</div>
      <div class="listen-inst">Choose the correct letter, <b>A, B, or C</b>.</div>

      <div class="mcq">
        <div class="mcq-q"><span class="qnum">30</span> Where will John and Jane meet up later that day?</div>
        <label class="mcq-opt"><input type="radio" name="q30" value="A" data-lq-radio="30"> A) The economics course office</label>
        <label class="mcq-opt"><input type="radio" name="q30" value="B" data-lq-radio="30"> B) The economics common room</label>
        <label class="mcq-opt"><input type="radio" name="q30" value="C" data-lq-radio="30"> C) The campus cafeteria</label>
      </div>
    </div>
  </div>
</div>

<div class="listen-page hidden" id="listenSec4">
  <div class="listen-block">
    <div class="listen-h">PART 4 - QUESTIONS 31-40</div>

    <div class="listen-card">
      <div class="listen-card-title">Questions 31-34</div>
      <div class="listen-inst">Choose the correct letter, <b>A, B, or C</b>.</div>

      <div class="mcq">
        <div class="mcq-q"><span class="qnum">31</span> Japan relies on oil tankers because</div>
        <label class="mcq-opt"><input type="radio" name="q31" value="A" data-lq-radio="31"> A) Japan has a prominent shipbuilding industry.</label>
        <label class="mcq-opt"><input type="radio" name="q31" value="B" data-lq-radio="31"> B) oil forms a major part of Japan's economy.</label>
        <label class="mcq-opt"><input type="radio" name="q31" value="C" data-lq-radio="31"> C) the country has no natural oil resources.</label>
      </div>

      <div class="mcq">
        <div class="mcq-q"><span class="qnum">32</span> Professor Wilson says that oil tankers are</div>
        <label class="mcq-opt"><input type="radio" name="q32" value="A" data-lq-radio="32"> A) very safe.</label>
        <label class="mcq-opt"><input type="radio" name="q32" value="B" data-lq-radio="32"> B) quite safe.</label>
        <label class="mcq-opt"><input type="radio" name="q32" value="C" data-lq-radio="32"> C) quite unsafe.</label>
      </div>

      <div class="mcq">
        <div class="mcq-q"><span class="qnum">33</span> According to Professor Wilson, the main cause of oil slicks is</div>
        <label class="mcq-opt"><input type="radio" name="q33" value="A" data-lq-radio="33"> A) accidents while loading and unloading oil.</label>
        <label class="mcq-opt"><input type="radio" name="q33" value="B" data-lq-radio="33"> B) collisions.</label>
        <label class="mcq-opt"><input type="radio" name="q33" value="C" data-lq-radio="33"> C) deliberate releases of oil.</label>
      </div>

      <div class="mcq">
        <div class="mcq-q"><span class="qnum">34</span> According to Professor Wilson, slicks are rarely burned off nowadays because</div>
        <label class="mcq-opt"><input type="radio" name="q34" value="A" data-lq-radio="34"> A) the oil is refined.</label>
        <label class="mcq-opt"><input type="radio" name="q34" value="B" data-lq-radio="34"> B) it usually doesn't work.</label>
        <label class="mcq-opt"><input type="radio" name="q34" value="C" data-lq-radio="34"> C) it creates too much air pollution.</label>
      </div>
    </div>

    <div class="listen-card">
      <div class="listen-card-title">Questions 35-39</div>
      <div class="listen-inst">Complete the table. Write <b>NO MORE THAN THREE WORDS</b> for each answer.</div>
      <div class="listen-card-title">Oil Exploration Clean-up Techniques</div>

      <div style="overflow-x:auto; margin-top:10px;">
        <table style="width:100%; border-collapse:collapse;">
          <thead>
            <tr>
              <th style="border:1px solid #ccc; padding:8px; text-align:left;">Techniques</th>
              <th style="border:1px solid #ccc; padding:8px; text-align:left;">Advantages</th>
              <th style="border:1px solid #ccc; padding:8px; text-align:left;">Disadvantages</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border:1px solid #ccc; padding:8px;">The Containment Boom</td>
              <td style="border:1px solid #ccc; padding:8px;">Cheap and easy</td>
              <td style="border:1px solid #ccc; padding:8px;">Only good when there are <span class="qnum">35</span> <input data-lq="35" class="l-input"></td>
            </tr>
            <tr>
              <td style="border:1px solid #ccc; padding:8px;">Chemical Detergents</td>
              <td style="border:1px solid #ccc; padding:8px;">Good for treating <span class="qnum">36</span> <input data-lq="36" class="l-input"></td>
              <td style="border:1px solid #ccc; padding:8px;">Chemicals remain in the water and kill marine life</td>
            </tr>
            <tr>
              <td style="border:1px solid #ccc; padding:8px;">The Sponge</td>
              <td style="border:1px solid #ccc; padding:8px;">Oil remains permanently in the sponge</td>
              <td style="border:1px solid #ccc; padding:8px;">The sponge mats turn into <span class="qnum">37</span> <input data-lq="37" class="l-input"></td>
            </tr>
            <tr>
              <td style="border:1px solid #ccc; padding:8px;">Bacteria</td>
              <td style="border:1px solid #ccc; padding:8px;">Cheap<br>Easy to administer<br>Totally <span class="qnum">38</span> <input data-lq="38" class="l-input"></td>
              <td style="border:1px solid #ccc; padding:8px;">There aren't any <span class="qnum">39</span> <input data-lq="39" class="l-input"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="listen-card">
      <div class="listen-card-title">Question 40</div>
      <div class="listen-inst">Complete the notes. Write <b>NO MORE THAN THREE WORDS</b> for each answer.</div>
      <div class="listen-card-title">Optional Essay Question</div>
      <div class="listen-notes">
        <div class="note-row">Remember to check out the faculty’s notice boards. You will find:</div>
        <div class="note-row bullet">- reading lists</div>
        <div class="note-row bullet">- essay questions</div>
        <div class="note-row bullet">- <span class="qnum">40</span> <input data-lq="40" class="l-input"></div>
      </div>
    </div>
  </div>
</div>

<div class="listen-footer">
  <div class="muted" id="listenAutosave">Autosave: ready</div>
  <button class="btn secondary" id="downloadListeningBtn" type="button">Download Listening answers (JSON)</button>
  <button class="btn secondary" id="copyListeningBtn" type="button">Copy Listening answers</button>
  <button class="btn" id="submitListeningBtn" type="button">Submit Listening now</button>
</div>
    `
  },

  writing: {
    task1Type: "Bar chart",
    task2Type: "Problem and solution",
    task1Html: `
      You should spend about 20 minutes on this task.<br>
      The bar chart shows the percentage of adult male smokers in seven countries along with the world average in 2000 and 2015.<br>
      Summarise the information by selecting and reporting the main features and make comparisons where relevant.<br>
      <b>Write at least 150 words.</b>
    `,
    task1ImageSrc: "https://audio.ieltsmock.org/WT1BG.png",
    task2Html: `
      Write about the following topic:<br><br>
      Some species of animals are almost extinct; and many others seem to be fast approaching a similar risk. What are the reasons for this? What should be done to solve this problem?<br><br>
      Give reasons for your answer and include any relevant examples from your own knowledge and experience.<br><br>
      <b>Write at least 250 words.</b>
    `
  },

  reading: {
    parts: [
      {
        id: "part1",
        passageText: `INSOMNIA – THE ENEMY OF SLEEP

A
It is not unusual to have sleep troubles from time to time. But, if you feel you do not get enough sleep, or satisfying sleep, you may have insomnia, a sleep disorder. People with insomnia have one or more of the following: difficulty in falling asleep, waking up often during the night and having trouble going back to sleep, waking up too early in the morning, and unrefreshing sleep. Insomnia is not defined by the number of hours you sleep every night. The amount of sleep a person needs varies. While most people need between 7 and 8 hours of sleep a night, some people do well with less, and some need more.

B
Insomnia occurs most frequently in people over the age of 60, in people with a history of depression, and in women, especially after the menopause. Severe emotional trauma can also cause insomnia, with divorced, widowed and separated people being the most likely to suffer from this sleep disorder. An irregular work schedule, jet lag or brain damage from a stroke or Alzheimer’s disease can also cause insomnia as can excessive use of alcohol or illicit drugs. However, stress, anxiety, illness and other disorders such as restless legs syndrome are the most common causes of insomnia.

C
The mechanism that induces sleep and the reason why sleep is necessary for good health and efficient mental functioning is not fully understood. We do know that sleep consists of two very different states: rapid eye movement (REM) sleep and non-REM sleep. In REM sleep, dreams occur, the eyes move under the closed lids and there is an increase in oxygen consumption, blood flow and neural activity. REM sleep occurs four or five times during a night. Beginning periods last about 10 to 15 minutes but the periods get longer as the night goes on. These interludes alternate with longer periods of non-REM sleep, when body functions slow down. Non-REM sleep has four stages. During the deepest stages (3 and 4) it is hard to rouse a sleeper. As the night goes on, the periods of non-REM sleep become progressively lighter. Sleep in stages 1 and 2 is felt to be restorative, as during this time the body repairs itself, utilising a hormone called “somatostatin”.

D
Researchers and healthcare providers define insomnia in several ways. One way is to categorise insomnia by how often it occurs. Another way is to identify the insomnia by what is causing the sleep deprivation. The two main types of insomnia have been described as “primary insomnia” and “secondary insomnia”. Primary insomnia is a chronic condition with little apparent association with stress or a medical problem. The most common form of primary insomnia is psychophysiological insomnia. Secondary insomnia is caused by symptoms that accompany a medical condition such as anxiety, depression or pain.

E
Improving one’s sleep hygiene helps improve insomnia in all patients. Relaxing during the hour before you go to sleep and creating a comfortable environment suited for sleep can be helpful. Older people who wake up earlier than normal or have trouble falling asleep may need less sleep than they used to. Changing one’s sleep pattern, either by going to bed later or waking up earlier, can be effective in dealing with insomnia in older people. Therapy also depends on the cause and severity of the insomnia. Transient and intermittent insomnia may not require any direct action since these conditions last only a few days at a time. However, if insomnia interferes with a person’s daily activities, something should be done. Usually the best method of dealing with insomnia is by attacking the underlying cause. For example, people who are depressed often have insomnia and working on this problem may eliminate the sleeping difficulties.

F
Not getting enough sleep can make you less productive, irritable and unable to concentrate. Lack of sleep can make it seem as if you “got out of the wrong side of bed". Waking up with a headache or feeling as if you never went to sleep can result in frustration. Stress can cause insomnia but insomnia also increases stress. Insomnia can make driving unsafe and can cause you to become less productive at work. It may leave you feeling as if you just can’t get enough done. Insomnia can also mask serious mental disorders. People with insomnia may think that not getting enough sleep is their only problem, but the insomnia may actually be one symptom of a larger disorder, such as depression. Studies show that people with insomnia are four times more likely to be depressed than people with a healthy sleeping pattern. In addition, lack of sleep can tax the heart and lead to serious conditions like heart disease.

G
Establishing certain set routines can help insomniacs get better sleep. Examples of these routines include: going to bed and getting up at the same time every day, avoiding naps, avoiding caffeine, nicotine, alcohol and eating heavily late in the day, exercising regularly and making your bedroom comfortable in terms of the bed, noise and temperature. Insomniacs should also only use their bedroom for sleep so that their bodies associate the room with sleep. Finally, if you can’t get to sleep, don’t toss and turn all night. Get up and read or do something that is not overly stimulating until you feel really sleepy again.`,
        blocks: [
          {
            type: "headings",
            title: "Questions 1 – 6",
            instructions: [
              "Reading Passage 1, Insomnia – The Enemy of Sleep, has seven paragraph. A – G.",
              "From the list of headings below, choose the most suitable ones for each paragraph, B – G.",
              "Write the appropriate number (i – ix) in answer boxes 1 – 6.",
              "NB There are more headings than paragraphs, so you will not use them all."
            ],
            listTitle: "List of Headings",
            headings: [
              { value: "i", label: "Normal Sleep Patterns" },
              { value: "ii", label: "What Medication Is Available?" },
              { value: "iii", label: "Habits to Promote a Good Night’s Sleep" },
              { value: "iv", label: "What is Insomnia?" },
              { value: "v", label: "Complications for Insomniacs" },
              { value: "vi", label: "Government Action" },
              { value: "vii", label: "When Should Insomnia be Treated?" },
              { value: "viii", label: "The Roots of Insomnia" },
              { value: "ix", label: "Classes of Insomnia" }
            ],
            questions: [
              { q: 1, paragraph: "Paragraph B" },
              { q: 2, paragraph: "Paragraph C" },
              { q: 3, paragraph: "Paragraph D" },
              { q: 4, paragraph: "Paragraph E" },
              { q: 5, paragraph: "Paragraph F" },
              { q: 6, paragraph: "Paragraph G" }
            ]
          },
          {
            type: "tfng",
            title: "Questions 7 – 14",
            instructions: [
              "Do the statements below (question 7 – 14) agree with the claims of the writer of Reading Passage 1, Insomnia – The Enemy of Sleep?",
              "In answer boxes 7 – 14, write:",
              "YES if the statement agrees with the writer",
              "NO if the statement contradicts the writer",
              "NOT GIVEN if it is impossible to say what the writer thinks about this"
            ],
            items: [
              { q: 7, text: "Someone who onlly gets four hours of sleep a night must be suffering from insomnia." },
              { q: 8, text: "Flying over long distances can cause insomnia." },
              { q: 9, text: "REM sleep is thought to be the most important for the body’s rest." },
              { q: 10, text: "Secondary insomnia is far more common than primary insomnia." },
              { q: 11, text: "Some sufferers of chronic insomnia may find changing the hours they sleep helpful." },
              { q: 12, text: "Many people who suffer from insomnia don’t realise that they suffer from it." },
              { q: 13, text: "There is no correlation linking insomnia and depression." },
              { q: 14, text: "Sleeping during the day can make insomnia worse." }
            ]
          }
        ]
      },
      {
        id: "part2",
        passageText: `Pollution in the Oceans

A
Everybody uses the sea directly or indirectly as a rubbish bin. Most of the substances thrown into the sea cannot be reused or broken down by nature and they cause soiling, destruction and death to the sea’s inhabitants. The marine protection organisation, Oceana, estimates that worldwide about 680 tonnes of waste are thrown directly into the oceans every hour, and more than half of this waste is made of plastic.

B
Between Hawaii and California, the Great Pacific Garbage Patch, an accumulation of small floating plastic pieces derived from bottle caps, carrier bags, fishing nets and so on, covers an area of the ocean’s surface as big as Western Europe. Due to its constant growth, the exact size of the Great Pacific Garbage Patch is unknown. The garbage patch developed in this area because of the North Pacific Subtropical Gyre, one of many oceanic gyres created by a convergence of ocean currents and wind. As the currents meet, the earth’s coriolis effect causes the water to slowly rotate, acting like a funnel that pulls together any rubbish that is floating in the water. The existence of a garbage patch was predicted in 1988 by the National Oceanic and Atmospheric Association (NOAA), but it was not officially discovered until 1997, because of its remote location and harsh conditions for navigation. The North Pacific gyre is one of five major ocean gyres, and it is likely that this trash vortex problem is present in other oceans as well.

C
Plastics can soak up and concentrate damaging pollutants, known as persistent organic pollutants (POPs), chemicals that can cause different cancers, increased infertility and brain and nervous system abnormalities. Any organism eating pieces of plastic debris will also take in these highly toxic pollutants. This leads to biomagnification, whereby the concentration of POPs increases greatly at every step in the food chain, and top predators end up with extremely high levels. Killer whales, for example, acquire the lifetime accumulation of POPs of the animals they eat. These toxins are also passed from female to calf during gestation and nursing.

D
In addition to these hazards, the floating plastics can also affect marine ecosystems by providing a ready surface for organisms to live on. These plants and animals can then be transported on the plastic far outside their normal environments, populating new ones and becoming possible nuisance species by interfering with the food chains or breeding pools in these new ecosystems.

E
Not all plastic floats; approximately 70 per cent of discarded plastic sinks to the bottom. In the North Sea, Dutch scientists have counted around 110 pieces of litter for every square kilometre of the seabed, which represents a staggering 600,000 tonnes in the North Sea alone. These plastics can smother the sea bottom and kill the marine life that is found there. A lot of this underwater rubbish comes from rivers, which also carry the rubbish underwater and is therefore unseen. The UK’s River Thames, for example, has recently undergone an experiment. Scientists used crab nets to catch underwater rubbish and retrieved more than 8,000 pieces of plastic over 3 months. All this rubbish would have ended up in the North Sea.

F
The idea of sea water rubbish processors being placed in the ocean to gather trash is currently under development. The processors would float on the surface of oceans and use long arms, known as "booms", to divert rubbish into the main body of the processor where small pieces of plastic debris would be filtered out of the water. The use of booms rather than net meshes would mean that even the smallest particles would be diverted and extracted, but virtually no by-catch would occur. The platforms would be completely self-supporting, receiving their energy from the sun, currents and waves. According to the inventor, reprocessing and selling the plastic retrieved by rubbish processors from the world’s gyres could potentially even be profitable.

G
Many campaigners against marine debris are sceptical about this suggestion, however. They point out that the size of the world’s oceans is so vast and the scope of the plastic trash problem so great that, even if they worked efficiently, processors of this type would have a negligible effect on the amount of trash in the oceans. What’s more, the sceptics say that recycled ocean plastic waste has very little commercial value, as it requires cleaning to remove sea life and toxins before it can be used. They also assert that it is extremely brittle, making it unsuitable for many of the purposes for which plastic is normally used.

H
Environmentalists like these believe that ocean clean-up solutions are pointless and futile and that the answer to the problem lies in prevention rather than cure. At a personal level, everyone can contribute by avoiding plastics in the things they buy and by disposing of their plastic waste responsibly. Publicity campaigns can make ship owners and operators, offshore platforms and fishing boat operators more aware of the consequences of the irresponsible disposal of plastic items at sea. Furthermore, by signing petitions, contributing to environmental organisations, taking part in beach clean-ups and exerting pressure on locally elected officials, members of the public can make their concerns known and contribute to the goal of preventing plastic waste ever reaching the sea.`,
        blocks: [
          {
            type: "endingsMatch",
            title: "Questions 15 – 21",
            instructions: [
              "Reading Passage 2, Pollution in the Oceans, has eight paragraphs (A – H).",
              "Which paragraph contains the information below?",
              "Write the correct letter, A – H, in answers boxes 15 – 21.",
              "NB You can use any letter more than once."
            ],
            endings: {
              A: "Paragraph A",
              B: "Paragraph B",
              C: "Paragraph C",
              D: "Paragraph D",
              E: "Paragraph E",
              F: "Paragraph F",
              G: "Paragraph G",
              H: "Paragraph H"
            },
            items: [
              { q: 15, text: "Food poinsoning in marine animals." },
              { q: 16, text: "Renewable energy powering machine rubbish collectors." },
              { q: 17, text: "The public’s role in marine pollution solutions." },
              { q: 18, text: "The ineffectiveness of marine rubbish collectors." },
              { q: 19, text: "Problematic travel area for ships." },
              { q: 20, text: "Negative effect on breeding in marine organisms." },
              { q: 21, text: "The spreading of species to new areas of the ocean." }
            ]
          },
          {
            type: "endingsMatch",
            title: "Questions 22 – 24",
            instructions: [
              "Complete each sentence with the correct ending.",
              "Choose from the list, A – D, below.",
              "Write the appropriate letters, A – D, in answer boxes 22 – 24."
            ],
            endings: {
              A: "… originates in the United States.",
              B: "… is plastic.",
              C: "… ends up in the Great Pacific Garbage Patch.",
              D: "… comes from ships."
            },
            items: [
              { q: 22, text: "Oceana has claimed that more than 50 per cent of all marine rubbish …" },
              { q: 23, text: "People do not know how big the Great Pacific Garbage Patch is because …" },
              { q: 24, text: "Scientists have recently discovered that rubbish in the River Thames …" }
            ]
          },
          {
            type: "tfng",
            title: "Questions 25 – 27",
            instructions: [
              "Do the statements below (questions 25 – 27) agree with the information given in Reading Passage 2, Pollution in the Oceans?",
              "In answer boxes 25 – 27, write:",
              "TRUE if the statement agrees with the information",
              "FALSE if the statement contradicts the information",
              "NOT GIVEN if there is no information on this in the reading passage"
            ],
            items: [
              { q: 25, text: "The person who came up with the idea for the sea water rubbish processors believes that sales of his machine could be profitable." },
              { q: 26, text: "Critics of marine clean-up operations claim that plastic recovered from the oceans is not appropriate for recycling." },
              { q: 27, text: "Many campaigners believe that the most effective solution to marine pollution is to deal with plastic waste on land." }
            ]
          }
        ]
      },
      {
        id: "part3",
        passageText: `Alternative Farming Methods in Oregon

Onion growers in eastern Oregon are adopting a system that saves water and keeps topsoil in place, while producing the highest quality “super colossal” onions. Pear growers in southern Oregon have reduced their use of some of the most toxic pesticides by up to two-thirds, and are still producing top-quality pears. Range managers throughout the state have controlled the poisonous weed, tansy ragwort, with insect predators and saved the Oregon livestock industry up to $4.8 million a year.

These are some of the results Oregon growers have achieved in collaboration with Oregon State University (OSU) researchers as they test new farming methods including Integrated Pest Management (IPM). Nationwide, however, IPM has not delivered results comparable to those in Oregon. A recent US General Accounting Office (GAO) report indicates that while Integrated Pest Management can result in dramatically reduced pesticide use, the federal government has been lacking in effectively promoting that goal and implementing IPM. Farmers also blame the government for not making the new options of pest management attractive. “Wholesale changes in the way that farmers control the pests on their farms is an expensive business,” Tony Brown, of the National Farmers Association says. “If the farmers are given tax breaks to offset the expenditure, then they would willingly accept the new practices.” The report goes on to note that even though the use of the riskiest pesticides has declined nationwide, they still make up more than 40 per cent of all pesticides used today; and national pesticide use has risen by 40 million kilograms since 1992. “Our food supply remains the safest and highest quality on Earth but we continue to overdose our farmland with powerful and toxic pesticides and to underuse the safe and effective alternatives,” charges Patrick Leahy, who commissioned the report. Green action groups disagree about the safety issue. “There is no way that habitual consumption of foodstuffs grown using toxic chemicals of the nature found on today’s farms can be healthy for consumers,” notes Bill Bowler, spokesman for Green Action, one of many lobbyists interested in this issue.

The GAO report singles out Oregon’s apple and pear producers who have used the new IPM techniques with growing success. Although Oregon is clearly ahead of the nation, scientists at OSU are taking the Government Accounting Office criticisms seriously. “We must continue to develop effective alternative practices that will reduce environmental hazards and produce high-quality products,” says Paul Jepson, a professor of entomology at OSU and new director of OSU’s Integrated Plant Protection Center (IPPC). The IPPC brings together scientists from OSU’s Agricultural Experiment Station, OSU Extension service, the US Department of Agriculture and Oregon farmers to help develop agricultural systems that will save water and soil, and reduce pesticides. In response to the GAO report, the Center is putting even more emphasis on integrating research and farming practices to improve Oregon agriculture environmentally and economically.

“The GAO report criticises agencies for not clearly communicating the goals of IPM,” says Jepson. “Our challenge is to greatly improve the communication to and from growers, to learn what works and what doesn’t. The work coming from OSU researchers must be adopted in the field and not simply languish in scientific journals.”

In Oregon, growers and scientists are working together to instigate new practices. For example, a few years ago scientists at OSU’s Malheur Experiment Station began testing a new drip irrigation system to replace old ditches that wasted water and washed soil and fertiliser into streams. The new system cut water and fertiliser use by half, kept topsoil in place and protected water quality. In addition, the new system produced crops of very large onions, rated “super colossal” and highly valued by the restaurant industry and food processors. Art Pimms, one of the researchers at Malheur comments: “Growers are finding that when they adopt more environmentally benign practices, they can have excellent results. The new practices benefit the environment and give the growers their success.”

OSU researchers in Malheur next tested straw mulch and found that it successfully held soil in place and kept the ground moist with less irrigation. In addition, and unexpectedly, the scientists found that the mulched soil created a home for beneficial beetles and spiders that prey on onion thrips – a notorious pest in commercial onion fields – a discovery that could reduce the need for pesticides. “I would never have believed that we could replace the artificial pest controls that we had before and still keep our good results,” comments Steve Black, a commercial onion farmer in Oregon, “but instead we have actually surpassed expectations.”

OSU researchers throughout the state have been working to reduce dependence on broad-spectrum chemical sprays that are toxic to many kinds of organisms, including humans. “Consumers are rightly putting more and more pressure on the industry to change its reliance on chemical pesticides, but they still want a picture-perfect product,” says Rick Hilton, entomologist at OSU’s Southern Oregon Research and Extension Center, where researchers help pear growers reduce the need for highly toxic pesticides. Picture-perfect pears are an important product in Oregon, and traditionally they have required lots of chemicals. In recent years, the industry has faced stiff competition from overseas producers, so any new methods that growers adopt must make sense economically as well as environmentally. Hilton is testing a growth regulator that interferes with the molting of codling moth larvae. Another study used pheromone dispensers to disrupt codling moth mating. These and other methods of Integrated Pest Management have allowed pear growers to reduce their use of organophosphates by two-thirds and reduce all other synthetic pesticides by even more and still produce top-quality pears. These and other studies around the state are part of the effort of the IPPC to find alternative farming practices that benefit both the economy and the environment.`,
        blocks: [
          {
            type: "endingsMatch",
            title: "Questions 28 - 35",
            instructions: [
              "Look at statements 28 - 35 and the list of people below.",
              "Match each statement with the correct person.",
              "Write the appropriate initials of the people in answer boxes 28 - 35."
            ],
            endings: {
              TB: "Tony Brown",
              PL: "Patrick Leahy",
              BB: "Bill Bowler",
              PJ: "Paul Jepson",
              AP: "Art Pimms",
              SB: "Steve Black",
              RH: "Rick Hilton"
            },
            items: [
              { q: 28, text: "There is a double advantage to the new techniques." },
              { q: 29, text: "Expectations of end-users of agricultural goods affect the products." },
              { q: 30, text: "The work on developing these alternative techniques is not finished." },
              { q: 31, text: "Eating food that has had chemicals used in its production is dangerous to our health." },
              { q: 32, text: "Changing current farming methods is not a cheap process." },
              { q: 33, text: "Results have exceeded anticipations." },
              { q: 34, text: "The research done should be translated into practical projects." },
              { q: 35, text: "The US produces the best food in the world." }
            ]
          },
          {
            type: "tfng",
            title: "Questions 36 - 40",
            instructions: [
              "Do the statements below (questions 36 - 40) agree with the information given in Reading Passage 3, Alternative Farming Methods in Oregon?",
              "In answer boxes 36 - 40, write:",
              "TRUE if the statement agrees with the information",
              "FALSE if the statement contradicts the information",
              "NOT GIVEN if there is no information on this in the reading passage"
            ],
            items: [
              { q: 36, text: "Integrated Pest Management has generally been regarded as a success in the US." },
              { q: 37, text: "Oregon farmers of apples and pears have been promoted as successful examples of Integrated Pest Management." },
              { q: 38, text: "The IPPC uses scientists from different organisations." },
              { q: 39, text: "Straw mulch experiments produced unplanned benefits." },
              { q: 40, text: "The apple industry is now facing a lot of competition from abroad." }
            ]
          }
        ]
      }
    ]
  }
};

const test12 = {
  listening: {
    audioSrc: "https://audio.ieltsmock.org/Listening35.mp3",
    html: `
<div class="listen-page" id="listenSec1">
  <div class="listen-block">
    <div class="listen-h">PART 1 - QUESTIONS 1-10</div>

    <div class="listen-card">
      <div class="listen-card-title">Questions 1-7</div>
      <div class="listen-inst">Complete the form. Write <b>ONE WORD AND/OR A NUMBER</b> for each answer.</div>
      <div class="listen-card-title">Report about a customer problem with a product</div>

      <div class="listen-notes">
        <div class="note-row"><b>Summary of customer’s problem</b></div>
        <div class="note-row bullet">● one bit of the item he bought was <span class="qnum">1</span> <input data-lq="1" class="l-input"></div>
        <div class="note-row bullet">● another piece was broken</div>

        <div class="note-row" style="margin-top:12px;"><b>Customer details</b></div>
        <div class="note-row">Name Gordon Cooper</div>
        <div class="note-row">Address 77 Woolbridge Lane, Whitesands</div>
        <div class="note-row">Postcode <span class="qnum">2</span> <input data-lq="2" class="l-input"></div>

        <div class="note-row" style="margin-top:12px;"><b>Product details</b></div>
        <div class="note-row">Type of item Bookcase</div>
        <div class="note-row">Name of item Maine <span class="qnum">3</span> <input data-lq="3" class="l-input"></div>
        <div class="note-row">Order reference <span class="qnum">4</span> <input data-lq="4" class="l-input"></div>
        <div class="note-row">Details of damage the <span class="qnum">5</span> <input data-lq="5" class="l-input"> shelf was broken</div>

        <div class="note-row" style="margin-top:12px;"><b>Arrangement for collection</b></div>
        <div class="note-row">Day of collection Wednesday</div>
        <div class="note-row">Time <span class="qnum">6</span> <input data-lq="6" class="l-input tiny"> pm</div>

        <div class="note-row" style="margin-top:12px;"><b>Contact details for customer</b></div>
        <div class="note-row">Email: <span class="qnum">7</span> <input data-lq="7" class="l-input">@mail.com</div>
      </div>
    </div>

    <div class="listen-card">
      <div class="listen-card-title">Questions 8-10</div>
      <div class="listen-inst">Complete the notes. Write <b>ONE WORD ONLY</b> for each answer.</div>
      <div class="listen-card-title">Customer feedback</div>

      <div class="listen-notes">
        <div class="note-row">Customer feels that the info about products on the website isn’t as <span class="qnum">8</span> <input data-lq="8" class="l-input"> as it could be:</div>
        <div class="note-row bullet">There is very little detail about:</div>
        <div class="note-row bullet">● how large the items are</div>
        <div class="note-row bullet">● their <span class="qnum">9</span> <input data-lq="9" class="l-input"></div>
        <div class="note-row bullet">● what materials are used</div>
        <div class="note-row">Some photos on the website are so <span class="qnum">10</span> <input data-lq="10" class="l-input"> that it’s hard to see the details.</div>
      </div>
    </div>
  </div>
</div>

<div class="listen-page hidden" id="listenSec2">
  <div class="listen-block">
    <div class="listen-h">PART 2 - QUESTIONS 11-20</div>

    <div class="listen-card">
      <div class="listen-card-title">Questions 11-14</div>
      <div class="listen-inst">Label the map below. Write the correct letter, <b>A-E</b>, next to each question.</div>

      <div style="margin: 14px 0; display:flex; justify-content:center;">
        <img
          src="https://audio.ieltsmock.org/Screenshot%202026-04-15%20at%2020.09.23.png"
          alt="Hargrove Nature Reserve map"
          style="max-width:100%; width:430px; height:auto; border:1px solid #ccc; border-radius:8px;"
        >
      </div>

      <div class="note-row"><span class="qnum">11</span> allotment garden
        <select class="l-select" data-lq="11">
          <option value=""></option><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option>
        </select>
      </div>
      <div class="note-row"><span class="qnum">12</span> toilet
        <select class="l-select" data-lq="12">
          <option value=""></option><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option>
        </select>
      </div>
      <div class="note-row"><span class="qnum">13</span> pond
        <select class="l-select" data-lq="13">
          <option value=""></option><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option>
        </select>
      </div>
      <div class="note-row"><span class="qnum">14</span> tool shed
        <select class="l-select" data-lq="14">
          <option value=""></option><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option>
        </select>
      </div>
    </div>

    <div class="listen-card">
      <div class="listen-card-title">Questions 15-16</div>
      <div class="listen-inst">Choose <b>TWO</b> letters, A-E.</div>
      <div class="listen-card-title">Which TWO things are a current challenge for the conservation group?</div>

      <label class="mcq-opt"><input type="checkbox" data-lq-check="15" value="A"> A) lack of money</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="15" value="B"> B) damage from rain</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="15" value="C"> C) getting enough volunteers</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="15" value="D"> D) litter that is left at the reserve</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="15" value="E"> E) finding the time to complete tasks</label>
    </div>

    <div class="listen-card">
      <div class="listen-card-title">Questions 17-18</div>
      <div class="listen-inst">Choose <b>TWO</b> letters, A-E.</div>
      <div class="listen-card-title">Which TWO jobs will be done today?</div>

      <label class="mcq-opt"><input type="checkbox" data-lq-check="17" value="A"> A) cutting grass</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="17" value="B"> B) planting trees</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="17" value="C"> C) identifying flowers</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="17" value="D"> D) mending equipment</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="17" value="E"> E) assembling new furniture</label>
    </div>

    <div class="listen-card">
      <div class="listen-card-title">Questions 19-20</div>
      <div class="listen-inst">Choose <b>TWO</b> letters, A-E.</div>
      <div class="listen-card-title">Which TWO benefits does the speaker say that people get from volunteering?</div>

      <label class="mcq-opt"><input type="checkbox" data-lq-check="19" value="A"> A) a better understanding of nature</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="19" value="B"> B) new friendships</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="19" value="C"> C) a sense of achievement</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="19" value="D"> D) their expenses reimbursed</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="19" value="E"> E) the chance to gain new skills</label>
    </div>
  </div>
</div>

<div class="listen-page hidden" id="listenSec3">
  <div class="listen-block">
    <div class="listen-h">PART 3 - QUESTIONS 21-30</div>

    <div class="listen-card">
      <div class="listen-card-title">Questions 21-24</div>
      <div class="listen-inst">Choose the correct letter, <b>A, B, or C</b>.</div>

      <div class="mcq">
        <div class="mcq-q"><span class="qnum">21</span> This week’s seminar will focus on the numbers of</div>
        <label class="mcq-opt"><input type="radio" name="q21" value="A" data-lq-radio="21"> A) women and men entering university.</label>
        <label class="mcq-opt"><input type="radio" name="q21" value="B" data-lq-radio="21"> B) girls and boys and in primary education.</label>
        <label class="mcq-opt"><input type="radio" name="q21" value="C" data-lq-radio="21"> C) females and males in education in developing countries.</label>
      </div>

      <div class="mcq">
        <div class="mcq-q"><span class="qnum">22</span> The students agree that the chapter by Hall</div>
        <label class="mcq-opt"><input type="radio" name="q22" value="A" data-lq-radio="22"> A) contained useful references.</label>
        <label class="mcq-opt"><input type="radio" name="q22" value="B" data-lq-radio="22"> B) provided a helpful summary.</label>
        <label class="mcq-opt"><input type="radio" name="q22" value="C" data-lq-radio="22"> C) had more detail than they needed.</label>
      </div>

      <div class="mcq">
        <div class="mcq-q"><span class="qnum">23</span> What problem did the students have with the reading list?</div>
        <label class="mcq-opt"><input type="radio" name="q23" value="A" data-lq-radio="23"> A) They were unable to access the online articles.</label>
        <label class="mcq-opt"><input type="radio" name="q23" value="B" data-lq-radio="23"> B) Some of the books they needed were unavailable.</label>
        <label class="mcq-opt"><input type="radio" name="q23" value="C" data-lq-radio="23"> C) It was unclear which texts they were supposed to read.</label>
      </div>

      <div class="mcq">
        <div class="mcq-q"><span class="qnum">24</span> What does Alice say she has changed her mind about?</div>
        <label class="mcq-opt"><input type="radio" name="q24" value="A" data-lq-radio="24"> A) the reasons why so few women receive a higher education</label>
        <label class="mcq-opt"><input type="radio" name="q24" value="B" data-lq-radio="24"> B) the reliability of statistics about gender and education</label>
        <label class="mcq-opt"><input type="radio" name="q24" value="C" data-lq-radio="24"> C) the actual number of men and women getting into higher education</label>
      </div>
    </div>

    <div class="listen-card">
      <div class="listen-card-title">Questions 25-30</div>
      <div class="listen-inst">Complete the notes below. Write <b>ONE OR TWO WORDS OR A NUMBER</b> for each answer.</div>
      <div class="listen-card-title">Gender studies — notes from pre-lecture reading</div>

      <div class="listen-notes">
        <div class="note-row"><b>Key statistics</b></div>
        <div class="note-row">One paper said that <span class="qnum">25</span> <input data-lq="25" class="l-input tiny">% more women than men were getting into university</div>
        <div class="note-row">There’s a higher chance that men on a course will <span class="qnum">26</span> <input data-lq="26" class="l-input">; men also do less well in their degrees</div>
        <div class="note-row">There are more males than females studying certain subjects, e.g. <span class="qnum">27</span> <input data-lq="27" class="l-input"> and some science courses</div>
        <div class="note-row">Most universities in the country have more women than men</div>

        <div class="note-row" style="margin-top:12px;"><b>Possible reasons for the differences</b></div>
        <div class="note-row">There are fewer male than female <span class="qnum">28</span> <input data-lq="28" class="l-input">, so there’s a lack of role models for males</div>
        <div class="note-row">There is no proof that this difference benefits women in a <span class="qnum">29</span> <input data-lq="29" class="l-input"> way</div>
        <div class="note-row">For assessment, schools have moved away from using <span class="qnum">30</span> <input data-lq="30" class="l-input">; this change has helped girls</div>
      </div>
    </div>
  </div>
</div>

<div class="listen-page hidden" id="listenSec4">
  <div class="listen-block">
    <div class="listen-h">PART 4 - QUESTIONS 31-40</div>

    <div class="listen-card">
      <div class="listen-card-title">Questions 31-40</div>
      <div class="listen-inst">Complete the notes below. Write <b>ONE WORD ONLY</b> for each answer.</div>
      <div class="listen-card-title">The rise and fall of plasma TVs</div>

      <div class="listen-notes">
        <div class="note-row">Plasma TV screens used to be popular in the early 2000’s</div>
        <div class="note-row">The screens contain cells filled with gas, which light up; this forms the picture</div>

        <div class="note-row" style="margin-top:12px;"><b>The development of plasma screens</b></div>
        <div class="note-row">Plasma screens were first developed at a <span class="qnum">31</span> <input data-lq="31" class="l-input"></div>
        <div class="note-row">Plasma screens could be used to clearly display information, e.g. in:</div>
        <div class="note-row bullet">● a hotel <span class="qnum">32</span> <input data-lq="32" class="l-input"></div>
        <div class="note-row bullet">● stock exchanges</div>

        <div class="note-row" style="margin-top:12px;"><b>Advantages of plasma TVs</b></div>
        <div class="note-row">Plasma technology enabled TVs to be on the <span class="qnum">33</span> <input data-lq="33" class="l-input"> in people’s homes</div>
        <div class="note-row">Compared to older TVs, plasma TVs:</div>
        <div class="note-row bullet">● looked good from different <span class="qnum">34</span> <input data-lq="34" class="l-input"></div>
        <div class="note-row bullet">● had a very <span class="qnum">35</span> <input data-lq="35" class="l-input"> picture</div>
        <div class="note-row">Plasma TV screens got 75% <span class="qnum">36</span> <input data-lq="36" class="l-input"> between 2006 and 2011</div>

        <div class="note-row" style="margin-top:12px;"><b>Criticisms of plasma TVs</b></div>
        <div class="note-row">Some people argued that because the colours weren’t so intense, plasma TVs:</div>
        <div class="note-row bullet">● were not so good for watching <span class="qnum">37</span> <input data-lq="37" class="l-input"></div>
        <div class="note-row bullet">● didn’t look their best in <span class="qnum">38</span> <input data-lq="38" class="l-input"> during the day</div>

        <div class="note-row" style="margin-top:12px;"><b>The decline of plasma TVs</b></div>
        <div class="note-row">Plasma TVs required more <span class="qnum">39</span> <input data-lq="39" class="l-input"> than other kinds of TV (e.g. OLED)</div>
        <div class="note-row">Sales <span class="qnum">40</span> <input data-lq="40" class="l-input"> in 2010</div>
        <div class="note-row">Manufacturers stopped making them in 2014</div>
      </div>
    </div>
  </div>
</div>

<div class="listen-footer">
  <div class="muted" id="listenAutosave">Autosave: ready</div>
  <button class="btn secondary" id="downloadListeningBtn" type="button">Download Listening answers (JSON)</button>
  <button class="btn secondary" id="copyListeningBtn" type="button">Copy Listening answers</button>
  <button class="btn" id="submitListeningBtn" type="button">Submit Listening now</button>
</div>
    `
  },

  writing: {
    task1Type: "Table",
    task2Type: "Advantages and disadvantages",
    task1Html: `
      You should spend about 20 minutes on this task.<br>
      The table below shows local catches and imports of fresh fish into Perth, Australia for the years 2004 - 2014.<br>
      Summarise the information by selecting and reporting the main features, and make comparisons where relevant.<br>
      <b>You should write at least 150 words.</b>
    `,
    task1ImageSrc: "https://audio.ieltsmock.org/table.png",
    task2Html: `
      You should spend about 40 minutes on this task.<br><br>
      Write about the following topic:<br><br>
      In some countries there are more young people choosing to enrol in work-based training instead of attending university.<br>
      Do the advantages of this situation outweigh the disadvantages?<br><br>
      Give reasons for your answer and include any relevant examples from your own knowledge or experience.<br><br>
      <b>Write at least 250 words.</b>
    `
  },

  reading: {
    parts: [
      {
        id: "part1",
        passageText: `FROM @TIBER TO @TWITTER
#ASymbolicSaga

Humans have shown a particular knack for the re-adaptation of the old and obsolete for novel purposes. Two examples of this inventiveness within the field of typography are the hash (#) and the 'at' sign (@).

The ‘at’ sign and the hash are most familiar to us nowadays thanks to the key parts they play in web communication. Both symbols are crucial to the functioning of microblogging networks in that they vastly increase the interconnectedness of postings, and hence readership. But while you probably won’t be surprised to learn that neither symbol was created specifically for this purpose, you may be by their journeys through history.

The hash has no official name, but has over the course of its history gone by close to twenty in the English language alone. Its roots are in the Ancient Roman phrase ‘libra pondo’ meaning ‘pound in weight’, shortened to ‘libra’ and abbreviated to ‘lb’. Medieval merchants later chose to include a small line across the top to indicate this contraction eventually resulting in the abbreviation beginning to appear as a single character. As European trade flourished in the sixteenth and seventeenth centuries, rushed writing made the symbol more abstract. Finally, by the late seventeenth century, English printers had made this new form of the abbreviation into an official character of their printing sets.

Linguists are divided as to when the 'at' symbol, also lacking an official name in English, made its first appearance. One theory suggests it dates back to the sixth or seventh century as an adaptation of the Latin word ad meaning ‘at’ or ‘towards’ and that in an attempt to simplify the number of pen strokes used, the upstroke of the letter ‘d’ became wrapped around the ‘a’. Others argue that the symbol is an abbreviation of arroba (from the Arabic ar-ruba meaning ‘one quarter’, or 25 pounds), which continues to be the Spanish term used for the symbol. A collection of fourteenth-century Florentine documents were recently discovered, suggesting the symbol may be used as a measure of quantity, an amphora, itself originally a type of container used to carry wine and grain.

By the late nineteenth century, the hash symbol had become so closely associated in American business usage with the marking of numbers that it had begun to be called the ‘number sign’ and was a prime candidate for inclusion on the new Qwerty keyboard layout. At this point it was mainly still used by business people whose accounts and transactions were typewritten. In the 1960s, it was introduced to the general public through its addition to Bell Lab’s new push button telephone keypad as one of two symbols to be used for touch-tone dialling. However, the age of the machine was not initially so kind to the 'at' sign. The same typewriters that included a place for the hash sign, did not do so for its future partner in social media. Furthermore, it was roundly ignored when decisions were made about symbols to be incorporated into the punch-card tabulating systems of the 1950s that paved the way for modern computer programming, although it did make its way onto the more spacious modern keyboards.

This presence on computer keyboards was noted by a young engineer named Ray Tomlinson, who had devised a method of leaving messages for other users while working on a precursor to the modern Internet. In 1972, he sent the first electronic message, using the symbol to mark the recipient’s location or institution, or where that person was ‘at’. He had chosen the symbol because it had not yet been tied to any other major computing function or textual context - essential, given that a computer would interpret its usage and any confusion would result in lost messages. This established usage meant that later developments in social networking were just a logical extension.

Meanwhile, the hash symbol had been singled out by early programmers, who appropriated it into the world of early online chat platforms to denote a specific ‘channel’ or chat room (i.e. ‘#sports’). This remained its primary function in communication for several decades until 2007 when Chris Messina, an early Twitter user, proposed its use to refer to topics. One key factor behind his choice of the hash symbol was the fact that it had been included in close proximity to the alphanumeric keys on increasingly web-compatible mobile phones. However, it was not until later that year that the concept became popular with users of the site, when another user began his tweets about a wildfire in San Jose with “San Jose fire”. This made a lot of sense to humans, but much less to the computers processing thousands of tweets in the system. Messina suggested that he write the phrase as one word preceded by a hash, and the benefits were immediately noticed - the hashtag had arrived.

While both symbols have garnered an array of creative names over the course of their histories, the fact that the hashtag is now immediately recognisable to billions around the world thanks to its latest role means that it is this name that persists. However, that is not to say that the ‘at’ sign’s evolution has avoided attention - it has recently been inducted into the Museum of Modern Art’s permanent collection, due to its standing as a symbol of “the possible future directions that are embedded in the arts of our time."`,
        blocks: [
          {
            type: "endingsMatch",
            title: "Questions 1 - 6",
            instructions: [
              "Look at statements 1 - 6 and the list of symbols below.",
              "Match each statement with the correct symbol.",
              "Write the appropriate letter in answer boxes 1 - 6.",
              "NB There are more questions than symbols."
            ],
            endings: {
              A: "The 'at' symbol (@)",
              B: "The 'hash' symbol (#)",
              C: "Both the 'at' (@) and the 'hash' (#) symbols",
              D: "Neither the 'at' (@) nor the 'hash' (#) symbols"
            },
            items: [
              { q: 1, text: "This symbol was designed to aid internet communication." },
              { q: 2, text: "The original symbol later received an addition to its appearance." },
              { q: 3, text: "The exact origins of this symbol are unclear." },
              { q: 4, text: "This symbol is not referred to universally or officially by one term." },
              { q: 5, text: "This symbol gained popularity in the twentieth century through its use in telecommunications developments." },
              { q: 6, text: "The lack of an established role for this symbol influenced its modern usage." }
            ]
          },
          {
            type: "sentenceGaps",
            title: "Questions 7 - 9",
            instructions: [
              "Complete the sentences.",
              "Use NO MORE THAN TWO WORDS from Reading Passage 1, From Tiber to Twitter, for each answer.",
              "Write them in answer boxes 7 - 9."
            ],
            items: [
              { q: 7, text: "The # and @ sign are useful tools in", tail: " communities, where they can help messages gain more views." },
              { q: 8, text: "Increased European import and export leading up to the 1800s led to the 'hash' symbol becoming more", tail: "." },
              { q: 9, text: "Some believe the 'at' symbol derives from a Latin word and that the", tail: " of its second letter became part of the first." }
            ]
          },
          {
            type: "multiTextChoices",
            title: "Questions 10 - 11",
            instructions: [
              "For each question, choose TWO correct options.",
              "Write them in any order in answer boxes 10 - 11.",
              "Which TWO statements are true of the 'at' sign (@)?"
            ],
            choices: [
              { letter: "A", text: "Its first appearance in communications came in the twentieth century." },
              { letter: "B", text: "It was used in a system which anticipated the development of computer programming." },
              { letter: "C", text: "Online use of the symbol evolved as a natural extension of earlier usage." },
              { letter: "D", text: "The development of the 'at sign' has received less attention than its social media partner, the hashtag." },
              { letter: "E", text: "Its cultural significance has received official recognition." }
            ],
            items: [
              { q: 10, text: "Which TWO statements are true of the 'at' sign (@)? Answer 1" },
              { q: 11, text: "Which TWO statements are true of the 'at' sign (@)? Answer 2" }
            ]
          },
          {
            type: "multiTextChoices",
            title: "Questions 12 - 13",
            instructions: [
              "For each question, choose TWO correct options.",
              "Write them in any order in answer boxes 12 - 13.",
              "Which TWO statements are true of the 'hash' sign (#)?"
            ],
            choices: [
              { letter: "A", text: "It was a late addition to the Qwerty keyboard layout." },
              { letter: "B", text: "It was chosen to be used in telephony because it was already well-known to the general public." },
              { letter: "C", text: "It was used in online communication before Twitter" },
              { letter: "D", text: "Its selection for use on Twitter stemmed from the development of other technologies." },
              { letter: "E", text: "The symbol became immediately popular on Twitter." }
            ],
            items: [
              { q: 12, text: "Which TWO statements are true of the 'hash' sign (#)? Answer 1" },
              { q: 13, text: "Which TWO statements are true of the 'hash' sign (#)? Answer 2" }
            ]
          }
        ]
      },
      {
        id: "part2",
        passageText: `Last Grains in the Hourglass

Few people would consider the sand they lie on at the beach a precious resource. However, we use more of it than any other substance except water and air, and it accounts for 87% of everything mined from the planet. Why? Since ancient Egyptian times, it has been used for construction and is the major ingredient in both concrete and glass. Almost all modern roads, buildings and bridges, silicon chips, detergents, cosmetics and even toothpaste are only possible thanks to billions of tonnes of sand. Humanity’s dependence on sand shows no signs of disappearing as our growing urban population will need countless more tonnes to sustain itself - it is estimated that China used more building aggregate (the mix of sand, gravel and crushed stone used in concrete) between 2011 and 2013 than did the United States in the entire 20th century. Environmentalists are now starting to realise the unsustainability of this; more sand is taken from the earth than can ever be replenished.

Looking at the world’s deserts, the idea that sand may be running out could seem ludicrous. In fact, these arid landscapes are growing as desertification and droughts affect nearly 170 countries. Ironically, though, they consist of the wrong sand for either construction or other manufacturing uses. Being formed by wind, desert sand is incredibly fine and rounded, with none of the sharp edges needed for human purposes, whereas sand dredged from rivers and ocean beds is perfect, as the water has insulated the grains, preventing them from rubbing against each other and losing their angular edges. In addition to beaches and riverbeds, we can also mine quartz sand from open pits but these are rapidly depleting.

The fact that we can only use certain types of sand from finite sources reveals the problem we are facing. Some countries, such as Australia, have large sand reserves. However, the price of the commodity can more than double when exported because of transport costs. For this reason, it is important that deposits are as near to construction sites as possible; otherwise, the increased costs are reflected in the price of housing and infrastructure. While some countries with no reserves are able to buy foreign sand - Singapore is one big importer, and the mighty Burj Khalifa tower in Dubai was made from Australian sand - the problem will become serious when a country depletes its local supply and is unable to import the volumes needed.

Though when a country does have access to sand supplies, there are still problems to consider. Extensive extraction alters rivers and coastal ecosystems and research shows sand mining has an adverse effect on many species - including dolphins, fish, crocodiles and crustaceans - due to their loss of habitats. The impact on humans is also potentially devastating because of the erosion of beaches and wetlands, whose geographical features protect communities from floods and storm surges and whose loss could be catastrophic.

A preventative measure implemented against this degradation is increasing restrictions on sand mining - imposing limits on quantities of sand that can be removed and requiring payment for land restoration in affected sites. Yet the ever-growing demand for construction has led to a huge increase in unlicensed, criminal extraction of sand to be sold on the black market. Half of all construction projects in Morocco are thought to use sand illegally sourced from its beaches, a trend being replicated all over the world. This problem is perhaps most acutely felt in India, where so-called ‘sand mafias’ battle to control illegal sand mining sources, leading to hundreds of deaths. Given that it is so hard to prove the provenance of sand, legislative measures to address the problem are difficult to enforce. It is an easily accessible resource which is almost impossible to regulate. The complexity of this issue is perhaps why it is often overlooked in policy and international development debate.

So, are there any measures we can take to avert this seemingly looming crisis? Certainly, we can and should recycle all concrete and stone structures; it is possible to re-extract sand from these materials rather than locating new sources. Yet nowhere near enough is generated through this process to meet our construction demands; it is thought that in 2012 alone we used enough sand to build a wall thirty metres wide and thirty metres tall around the circumference of the earth. Other than recycling, engineers are trialling more creative solutions. In the UK, a group of researchers are experimenting with a concrete that substitutes up to 10% of sand with tiny particles of waste plastic. However, this would only be a partial solution and many environmentalists would take issue with the potential release of trillions of plastic particles into the ecosystem. Another group of researchers in the Netherlands are experimenting with a type of bio-concrete, which utilises bacteria to self-heal by filling cracks with limestone, thereby dramatically reducing the need to repair or replace existing concrete structures. However, these measures are only a partial fix to a complex problem. Unless we are able to quench our thirst for construction or find a sustainable alternative, the sands of time will inevitably run out.`,
        blocks: [
          {
            type: "endingsMatch",
            title: "Questions 14 - 20",
            instructions: [
              "Complete each sentence with the correct ending, A - I.",
              "Write the appropriate letters, A - I, in answer boxes 14 - 20."
            ],
            endings: {
              A: "... too smooth for building needs.",
              B: "... thought to have been used more in one three-year period than in the previous century.",
              C: "... problematic due to a synthetic component.",
              D: "... being investigated as a solution for building maintenance.",
              E: "... always stored on sites for efficient usage.",
              F: "... having an adverse effect on flora and fauna.",
              G: "... ideal for human purposes due to its roughness.",
              H: "... unviable for many projects due to its cost.",
              I: "... a cause of death and conflict in some regions."
            },
            items: [
              { q: 14, text: "A common sand composite is ..." },
              { q: 15, text: "Sand in deserts is ..." },
              { q: 16, text: "Sand taken from under bodies of water is ..." },
              { q: 17, text: "Foreign sand is ..." },
              { q: 18, text: "Mined sand is ..." },
              { q: 19, text: "The unlawful extraction of sand is ..." },
              { q: 20, text: "Bio-concrete is ..." }
            ]
          },
          {
            type: "sentenceGaps",
            title: "Questions 21 - 24",
            instructions: [
              "Complete the summary.",
              "Use NO MORE THAN TWO WORDS from Reading Passage 2, Last Grains in the Hourglass, for each answer.",
              "Write them in answer boxes 21 - 24."
            ],
            items: [
              { q: 21, text: "Whereas sand created by winds is too", tail: " in shape for building and manufacturing purposes," },
              { q: 22, text: "", tail: " from the seabed are ideal due to their sharp edges." },
              { q: 23, text: "Yet changes in rivers and", tail: " are leading to the elimination of many creatures' habitats." },
              { q: 24, text: "Mankind may also suffer the consequences due to the", tail: " of the coastal landscape safeguarding urban areas." }
            ]
          },
          {
            type: "tfng",
            title: "Questions 25 - 27",
            instructions: [
              "Do the statements agree with the claims of the writer of Reading Passage 2, Last Grains in the Hourglass?",
              "In answer boxes 25 - 27 write:",
              "YES if the statement agrees with the writer",
              "NO if the statement contradicts the writer",
              "NOT GIVEN if it is impossible to say what the writer thinks about this"
            ],
            items: [
              { q: 25, text: "Calculations for future sand usage show we will need more than exists on the entire planet." },
              { q: 26, text: "The only complete solution is to research alternative sand-free building materials." },
              { q: 27, text: "The catastrophic effects of running out of sand are close to happening." }
            ]
          }
        ]
      },
      {
        id: "part3",
        passageText: `HOME SWEET HOME

A
Culture shock is not an uncommon phenomenon. Most of us, when travelling to unfamiliar shores would be shocked not to suffer some disorientation at being flung into a new time zone, operating under a different set of beliefs and traditions to those we are used to. However, reverse culture shock - that same sensation experienced upon returning to one's home country after time spent abroad - is often an unexpected surprise. The extent to which one suffers will depend upon many factors. However, re-entry in the worst of cases can lead to the asking of such basic existential questions as 'who am I?' or 'where do I belong?'

B
To answer these questions, it is necessary to consider the often pleasurable experience of first setting foot in the foreign country that is to become your home and the four phases of the subsequent cultural readjustment. First is the honeymoon period. Upon arriving, a stage of acclimatisation is expected and often exciting, as new cuisine, timetables and customs are discovered. A new language may be challenging, you may have a new job, new friends and neighbours, a new home. Yet once the novelty wears off, it may be replaced by feeling lonely and homesick. This is the negotiation period, followed by the adjustment phase, during which, over time, these 'fish-out-of-water' feelings subside, until you subconsciously adopt the once strange and foreign as extended facets of yourself. This place now feels like home and the fourth stage - adaptation - is complete.

C
But what is home? Craig Storti in his book The Art of Coming Home gives two definitions. The most literal is that home is the place you are raised, where you share a language and behaviour with others. The more profound is that 'home' relates to feeling and routines, the place you are understood, accepted and forgiven, where you can truly 'be yourself'. And here begins the problem. Those who have spent significant time abroad, and have paid visits to their country of origin are undoubtedly familiar with the euphoria of catching up with loved ones, knowing they will soon be back 'home' and again living their daily routine. The very definition of 'home', and with it identity of self, can become confused as sufferers feel they have one foot firmly planted in each culture, yet actually find themselves neither here nor there.

D
The enthusiasm those living abroad feel when visiting their homeland can be replicated when returning permanently. Feelings of longing for 'home', having possibly been idealised, may make the prospect a shining one. Storti, quoting a theory proposed by Lysgaard in 1955, views the transition as U-shaped, with this initial feeling a high point. Nevertheless, once reality sets in and initial euphoria wears off, it can be quickly replaced by alienation. You no longer feel you fit into your own culture, family, friendship network, customs: home. This is the bottom of the U. Gullahorn and Gullahorn expanded the U hypothesis in 1963, introducing their W-curve hypothesis, exemplifying both the initial shock and that felt upon returning. Both 'shocks' may be considered to contain the same four aforementioned phases.

E
This dip to the depths of the second U can be explained by several factors. Firstly, you have come to view old norms, values, faces and places from a 'foreign' perspective not available to you pre-travel. Additionally, returners' expectations may be of 'taking up where you left off', only to find a new reality that appears similar, yet whose functions are completely alien. Further considerations are the voluntary or involuntary nature of one's return, length of time abroad, the degree of interaction with the foreign culture, and the levels of difference between it and the home culture. Research suggests millions of people, their families and children included, are affected by culture shock at any one time, the reverse type being much more complex to overcome due to its unexpected nature.

F
So, how to deal with this and the questions raised earlier? The US Department of State, in offering advice to repatriates, states three main considerations. Firstly, you have changed. Your recent life-changing experience means your idea of self has evolved and morphed. Additionally, home and your perceptions of it have been redefined, along with your relationships and, finally, your culture has changed. Having taken on a new cultural identity, now you must adapt anew. Storti also discusses four effects seen during this process. Those returning can become highly critical and judgemental of the home environment, in addition to feeling marginalised as they no longer fit in. A change in day-to-day routines, paying attention to patterns and customs can be exhausting, and these former three points and the disconnection they create, can lead to withdrawal and depression.

G
As more research into the condition becomes available, maybe combating it will lie in being aware of it beforehand and creating the mentality to deal with it: forewarned is forearmed. Pico Iyer, a British-born essayist and novelist of Indian origin, residing mainly in the US for the last 48 years, yet spending as much time as possible in Japan over the last 25, offers sound advice. In a talk for TED he discusses his multiple ‘origins’, rationalising them as 'taking pieces of many places and putting them together in a stained glass whole’. He goes on to discuss home as anything but a physical place, echoing Storti's second definition of home, stating 'home has less to do with a piece of soil than a piece of soul', suggesting the new international, intercultural you is a positive to be embraced, not a negative to be denied.`,
        blocks: [
          {
            type: "endingsMatch",
            title: "Questions 28 - 35",
            instructions: [
              "Reading Passage 3, Home Sweet Home has seven paragraphs, A - G.",
              "Which paragraph contains the following information?",
              "Write the appropriate letters, A - G, in answer boxes 28 - 35.",
              "NB You can use any letter more than once."
            ],
            endings: {
              A: "Paragraph A",
              B: "Paragraph B",
              C: "Paragraph C",
              D: "Paragraph D",
              E: "Paragraph E",
              F: "Paragraph F",
              G: "Paragraph G"
            },
            items: [
              { q: 28, text: "An account from an experienced expatriate." },
              { q: 29, text: "The development of an earlier academic theory." },
              { q: 30, text: "A comparison of different types of culture shock," },
              { q: 31, text: "The factors leading to feeling detached and despondent." },
              { q: 32, text: "The dual interpretations of home." },
              { q: 33, text: "The development of a two-phase theory." },
              { q: 34, text: "Pleasant initial feelings in a new country." },
              { q: 35, text: "Questions that some people seek answers to." }
            ]
          },
          {
            type: "tfng",
            title: "Questions 36 - 40",
            instructions: [
              "Do the statements agree with the claims of the writer of Reading Passage 3, Home Sweet Home?",
              "In answer boxes 36 - 40 write:",
              "YES if the statement agrees with the writer",
              "NO if the statement contradicts the writer",
              "NOT GIVEN if it is impossible to say what the writer thinks about this"
            ],
            items: [
              { q: 36, text: "Expatriates feel a sense of isolation in new countries because everything is so new." },
              { q: 37, text: "There are four stages to the process of readjusting back to your home culture." },
              { q: 38, text: "People don’t anticipate reverse culture shock, which makes it harder to deal with." },
              { q: 39, text: "Those who return to their home country are more sensitive to their fellow countrymen’s opinions." },
              { q: 40, text: "People who live abroad make a choice to identify with either their home culture or the foreign culture." }
            ]
          }
        ]
      }
    ]
  }
};

const test13 = {
  listening: {
    audioSrc: "https://audio.ieltsmock.org/Listening%2034.mp3",
    html: `
<div class="listen-page" id="listenSec1">
  <div class="listen-block">
    <div class="listen-h">PART 1 - QUESTIONS 1-10</div>

    <div class="listen-card">
      <div class="listen-card-title">Questions 1-5</div>
      <div class="listen-inst">Complete the notes. Write <b>ONE WORD AND/OR A NUMBER</b> for each answer.</div>
      <div class="listen-card-title">Getting a visa to travel to Thailand</div>

      <div class="listen-notes">
        <div class="note-row"><b>Main types of visa:</b></div>
        <div class="note-row">business visa (for working in Thailand)</div>
        <div class="note-row bullet">● lasts for <span class="qnum">1</span> <input data-lq="1" class="l-input tiny"> days</div>
        <div class="note-row">for people going to Thailand on holiday or visiting for <span class="qnum">2</span> <input data-lq="2" class="l-input"> reasons</div>
        <div class="note-row bullet">● lasts for 60 days</div>

        <div class="note-row" style="margin-top:12px;"><b>Getting a tourist visa</b></div>
        <div class="note-row">may need to provide a <span class="qnum">3</span> <input data-lq="3" class="l-input"> certificate or a driving licence</div>
        <div class="note-row">will need a passport that is still valid for a minimum of <span class="qnum">4</span> <input data-lq="4" class="l-input"></div>
        <div class="note-row">need to:</div>
        <div class="note-row bullet">● fill in a form to apply for a tourist visa</div>
        <div class="note-row bullet">● provide two passport photos — must be <span class="qnum">5</span> <input data-lq="5" class="l-input"> and the same size</div>
      </div>
    </div>

    <div class="listen-card">
      <div class="listen-card-title">Questions 6-10</div>
      <div class="listen-inst">Complete the form. Write <b>ONE WORD AND/OR A NUMBER</b> for each answer.</div>
      <div class="listen-card-title">Tourist visa application form</div>

      <div class="listen-notes">
        <div class="note-row"><b>PERSONAL DETAILS</b></div>
        <div class="note-row">Nationality <span class="qnum">6</span> <input data-lq="6" class="l-input"></div>
        <div class="note-row">Surname Johnston</div>
        <div class="note-row">First name Alan</div>
        <div class="note-row">Middle name <span class="qnum">7</span> <input data-lq="7" class="l-input"></div>
        <div class="note-row">Mobile number <span class="qnum">8</span> <input data-lq="8" class="l-input"></div>

        <div class="note-row" style="margin-top:12px;"><b>TRAVEL DETAILS</b></div>
        <div class="note-row">Years of previous trips to Thailand 1992 and <span class="qnum">9</span> <input data-lq="9" class="l-input tiny"></div>
        <div class="note-row">Start date of visa for travel to Thailand September 1</div>
        <div class="note-row">Probable destination country after departure from Thailand <span class="qnum">10</span> <input data-lq="10" class="l-input"></div>
      </div>
    </div>
  </div>
</div>

<div class="listen-page hidden" id="listenSec2">
  <div class="listen-block">
    <div class="listen-h">PART 2 - QUESTIONS 11-20</div>

    <div class="listen-card">
      <div class="listen-card-title">Questions 11-12</div>
      <div class="listen-inst">Choose <b>TWO</b> letters, A-E.</div>
      <div class="listen-card-title">Which TWO things has the building been in the past?</div>

      <label class="mcq-opt"><input type="checkbox" data-lq-check="11" value="A"> A) a factory</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="11" value="B"> B) a warehouse</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="11" value="C"> C) an artists’ studio</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="11" value="D"> D) a railway station</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="11" value="E"> E) a shopping centre</label>
    </div>

    <div class="listen-card">
      <div class="listen-card-title">Questions 13-14</div>
      <div class="listen-inst">Choose <b>TWO</b> letters, A-E.</div>
      <div class="listen-card-title">Which TWO facilities will residents of the building be able to use for free?</div>

      <label class="mcq-opt"><input type="checkbox" data-lq-check="13" value="A"> A) the pool</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="13" value="B"> B) the gym</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="13" value="C"> C) the laundry</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="13" value="D"> D) a parking space</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="13" value="E"> E) the common room</label>
    </div>

    <div class="listen-card">
      <div class="listen-card-title">Questions 15-16</div>
      <div class="listen-inst">Choose <b>TWO</b> letters, A-E.</div>
      <div class="listen-card-title">In which TWO ways is the building sustainable?</div>

      <label class="mcq-opt"><input type="checkbox" data-lq-check="15" value="A"> A) There is a space for wildlife on top of the building.</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="15" value="B"> B) It has small windows to conserve heat.</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="15" value="C"> C) All the apartments have heat pumps.</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="15" value="D"> D) No gas is used in the building.</label>
      <label class="mcq-opt"><input type="checkbox" data-lq-check="15" value="E"> E) Natural materials were used.</label>
    </div>

    <div class="listen-card">
      <div class="listen-card-title">Questions 17-20</div>
      <div class="listen-inst">What feature does the speaker recommend about each of the following apartments? Write the appropriate letter, <b>A-C</b>, for each question.</div>
      <div class="people-box">
        <div><b>A</b> what is already provided in the rooms</div>
        <div><b>B</b> the views from the apartment</div>
        <div><b>C</b> the apartment’s outdoor area</div>
      </div>

      <div class="note-row"><span class="qnum">17</span> Keyboard Apartment
        <select class="l-select" data-lq="17">
          <option value=""></option><option>A</option><option>B</option><option>C</option>
        </select>
      </div>
      <div class="note-row"><span class="qnum">18</span> The Brubeck
        <select class="l-select" data-lq="18">
          <option value=""></option><option>A</option><option>B</option><option>C</option>
        </select>
      </div>
      <div class="note-row"><span class="qnum">19</span> Sonata Rooms
        <select class="l-select" data-lq="19">
          <option value=""></option><option>A</option><option>B</option><option>C</option>
        </select>
      </div>
      <div class="note-row"><span class="qnum">20</span> The Nyman Flat
        <select class="l-select" data-lq="20">
          <option value=""></option><option>A</option><option>B</option><option>C</option>
        </select>
      </div>
    </div>
  </div>
</div>

<div class="listen-page hidden" id="listenSec3">
  <div class="listen-block">
    <div class="listen-h">PART 3 - QUESTIONS 21-30</div>

    <div class="listen-card">
      <div class="listen-card-title">Questions 21-24</div>
      <div class="listen-inst">Choose the correct letter, <b>A, B, or C</b>.</div>

      <div class="mcq">
        <div class="mcq-q"><span class="qnum">21</span> Why did James choose his work placement with the manufacturing company?</div>
        <label class="mcq-opt"><input type="radio" name="q21" value="A" data-lq-radio="21"> A) He thought its products were interesting.</label>
        <label class="mcq-opt"><input type="radio" name="q21" value="B" data-lq-radio="21"> B) He failed to get one with the software firm.</label>
        <label class="mcq-opt"><input type="radio" name="q21" value="C" data-lq-radio="21"> C) He wanted to work for a large global business.</label>
      </div>

      <div class="mcq">
        <div class="mcq-q"><span class="qnum">22</span> What did James like best about his work placement?</div>
        <label class="mcq-opt"><input type="radio" name="q22" value="A" data-lq-radio="22"> A) broadening his business experience</label>
        <label class="mcq-opt"><input type="radio" name="q22" value="B" data-lq-radio="22"> B) getting to know people in different departments</label>
        <label class="mcq-opt"><input type="radio" name="q22" value="C" data-lq-radio="22"> C) learning how market analysis is linked to product design</label>
      </div>

      <div class="mcq">
        <div class="mcq-q"><span class="qnum">23</span> James says that if his placement had been with a smaller company, he’d have been able to</div>
        <label class="mcq-opt"><input type="radio" name="q23" value="A" data-lq-radio="23"> A) earn more money.</label>
        <label class="mcq-opt"><input type="radio" name="q23" value="B" data-lq-radio="23"> B) prevent others from taking risks.</label>
        <label class="mcq-opt"><input type="radio" name="q23" value="C" data-lq-radio="23"> C) have a greater effect on the business.</label>
      </div>

      <div class="mcq">
        <div class="mcq-q"><span class="qnum">24</span> In what way does James feel the placement was well-organised?</div>
        <label class="mcq-opt"><input type="radio" name="q24" value="A" data-lq-radio="24"> A) He never had any problems while he was with the company.</label>
        <label class="mcq-opt"><input type="radio" name="q24" value="B" data-lq-radio="24"> B) There was one person he could always contact if necessary.</label>
        <label class="mcq-opt"><input type="radio" name="q24" value="C" data-lq-radio="24"> C) Various managers showed him how their departments work.</label>
      </div>
    </div>

    <div class="listen-card">
      <div class="listen-card-title">Questions 25-30</div>
      <div class="listen-inst">Complete the flow-chart. Write the appropriate letter, <b>A-G</b>, in the space for each answer.</div>
      <div class="people-box">
        <div><b>A</b> check it for any mistakes</div>
        <div><b>B</b> arrange another appointment</div>
        <div><b>C</b> identify suitable titles for different sections</div>
        <div><b>D</b> submit a small sample of work to the tutor</div>
        <div><b>E</b> think of possible ways to organise the portfolio</div>
        <div><b>F</b> see what other people think about your ideas</div>
        <div><b>G</b> find out what you are assessed on</div>
      </div>

      <div class="note-row">Use the module handbook to <span class="qnum">25</span>
        <select class="l-select" data-lq="25">
          <option value=""></option><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option><option>F</option><option>G</option>
        </select>
      </div>
      <div class="note-row">Use old assignments in the library to <span class="qnum">26</span>
        <select class="l-select" data-lq="26">
          <option value=""></option><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option><option>F</option><option>G</option>
        </select>
      </div>
      <div class="note-row">Consult the Learning Objectives in order to <span class="qnum">27</span>
        <select class="l-select" data-lq="27">
          <option value=""></option><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option><option>F</option><option>G</option>
        </select>
      </div>
      <div class="note-row"><span class="qnum">28</span>
        <select class="l-select" data-lq="28">
          <option value=""></option><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option><option>F</option><option>G</option>
        </select>
        and get feedback
      </div>
      <div class="note-row">Use the online forum to <span class="qnum">29</span>
        <select class="l-select" data-lq="29">
          <option value=""></option><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option><option>F</option><option>G</option>
        </select>
      </div>
      <div class="note-row">Ask another person to <span class="qnum">30</span>
        <select class="l-select" data-lq="30">
          <option value=""></option><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option><option>F</option><option>G</option>
        </select>
      </div>
    </div>
  </div>
</div>

<div class="listen-page hidden" id="listenSec4">
  <div class="listen-block">
    <div class="listen-h">PART 4 - QUESTIONS 31-40</div>

    <div class="listen-card">
      <div class="listen-card-title">Questions 31-40</div>
      <div class="listen-inst">Complete the notes below. Write <b>ONE WORD ONLY</b> for each answer.</div>
      <div class="listen-card-title">The Chimp Paradox by Professor Steve Peters</div>

      <div class="listen-notes">
        <div class="note-row"><b>The basic idea of The Chimp Paradox</b></div>
        <div class="note-row">Sometimes, humans behave a bit like chimpanzees!</div>
        <div class="note-row">According to Peters, the brain contains two parts: ‘human’ and ‘chimp’</div>

        <div class="note-row" style="margin-top:12px;"><b>The ‘human’ is the part of the brain that:</b></div>
        <div class="note-row bullet">● is usually <span class="qnum">31</span> <input data-lq="31" class="l-input"></div>
        <div class="note-row bullet">● likes to have <span class="qnum">32</span> <input data-lq="32" class="l-input"></div>

        <div class="note-row" style="margin-top:12px;"><b>The ‘chimp’</b></div>
        <div class="note-row bullet">● is more <span class="qnum">33</span> <input data-lq="33" class="l-input"> than the human</div>
        <div class="note-row bullet">● can be a friend or an enemy</div>

        <div class="note-row">Having these two very different parts of the brain often leads to a <span class="qnum">34</span> <input data-lq="34" class="l-input">; this is the ‘chimp paradox’</div>

        <div class="note-row" style="margin-top:12px;"><b>Examples of the chimp paradox</b></div>
        <div class="note-row bullet">● entering a room full of <span class="qnum">35</span> <input data-lq="35" class="l-input"> and being unsure how to react</div>
        <div class="note-row bullet">● deciding whether to complete a dull task or to <span class="qnum">36</span> <input data-lq="36" class="l-input"></div>

        <div class="note-row" style="margin-top:12px;"><b>Applications of The Chimp Paradox in sport</b></div>
        <div class="note-row">The Chimp Paradox famously helped convince a well-known <span class="qnum">37</span> <input data-lq="37" class="l-input"> to continue</div>
        <div class="note-row">She says the ‘chimp’ approach helped her become a <span class="qnum">38</span> <input data-lq="38" class="l-input"></div>
        <div class="note-row">Snooker player Ronnie O’Sullivan said that Peters’ ideas enabled him to deal with <span class="qnum">39</span> <input data-lq="39" class="l-input"></div>
        <div class="note-row">Peters encouraged O’Sullivan to find time for <span class="qnum">40</span> <input data-lq="40" class="l-input">, which he enjoyed</div>
      </div>
    </div>
  </div>
</div>

<div class="listen-footer">
  <div class="muted" id="listenAutosave">Autosave: ready</div>
  <button class="btn secondary" id="downloadListeningBtn" type="button">Download Listening answers (JSON)</button>
  <button class="btn secondary" id="copyListeningBtn" type="button">Copy Listening answers</button>
  <button class="btn" id="submitListeningBtn" type="button">Submit Listening now</button>
</div>
    `
  },

  writing: {
    task1Type: "Line graph",
    task2Type: "Opinion essay",
    task1Html: `
      You should spend about 20 minutes on this task.<br>
      The line graphs below show the subscriptions to mobile and fixed phone lines in four different countries between 2005 and 2015.<br>
      Summarise the information by selecting and reporting the main features and make comparisons where relevant.<br>
      <b>Write at least 150 words.</b>
    `,
    task1ImageSrc: "https://audio.ieltsmock.org/Screenshot%202026-04-16%20at%2009.49.43.png",
    task2Html: `
      You should spend about 40 minutes on this task.<br><br>
      Write about the following topic:<br><br>
      There is a lot of pressure on young people today to succeed academically. As a result, some people believe that non-academic subjects, such as physical education and cookery, should be removed from the school syllabus so that children can concentrate on academic work.<br>
      To what extent do you agree or disagree?<br><br>
      Give reasons for your answer and include any relevant examples from your own knowledge and experience.<br><br>
      <b>Write at least 250 words.</b>
    `
  },

  reading: {
    parts: [
      {
        id: "part1",
        passageText: `MINDFULNESS

In 2011, the World Health Organisation released a report stating that by 2030 mental ill-health would be the biggest burden of disease in developed countries. In searching for new approaches to tackle this rising global epidemic, mindfulness has gained significant ground. Although research around it remains in its infancy, this ever-accelerating phenomenon has recently become the subject of academic curiosity due to practitioners’ claims of its countless health benefits and flexibility of application.

Mindfulness, commonly defined as the state of being attentive to and aware of the present moment, has its roots in reflective Eastern traditions of philosophy. While modern day mindfulness is used as a preventative or therapeutic tool, it was originally taught as a means of seeing the true nature of reality. It was believed that, through careful attention to the sensory experience, one was able to realise the impermanent nature of all things, transcend the concept of self, and ultimately attain a state free from suffering, known as enlightenment.

Through the 1970s, Western interest in these concepts and practices rapidly grew, drawing travellers from America and Europe to Asia. One MIT molecular biology student, Jon Kabat-Zinn, was able to take a modern scientific-based perspective to traditional Eastern principles of mindfulness and meditation, resulting in the familiar Western concept which downplays the traditional spiritual or religious aspects. He later founded the Stress Reduction Clinic at the University of Massachusetts Medical School, going on to develop a Mindfulness-Based Stress Reduction (MBSR) programme: an eight-week course aimed at reducing people’s stress levels; and later a Mindfulness-Based Cognitive Therapy (MBCT) programme dealing with severe mental health issues such as depression and anxiety.

These days, scientific research into mindfulness abounds and a number of reports have emphasised its potential. A 2013 study conducted by Massachusetts General Hospital of sufferers of Generalised Anxiety Disorder (GAD) showed participants receiving mindfulness-based treatment to have a significantly greater reduction in anxiety than a control group. This response to mindfulness-based treatment does not appear to merely be a psychological one either. A recent paper from Pittsburgh University’s Neuroscience department showed mindfulness can actually shrink the amygdala - the part of our brain controlling our 'fight or flight' response - while simultaneously diminishing the connection between the amygdala and the rest of the brain. What this amounts to is that, through mindfulness, our brain becomes better able to mediate our primal response to stress and, thus, not let it affect us so much.

Another booming area of research is the use of mindfulness for helping cancer patients deal with the fear that accompanies diagnosis. One of the largest studies in this area, published in the Journal of Clinical Oncology, showed breast cancer survivors who practised mindfulness exhibited increased calm and wellbeing, better sleep and less physical pain. One cancer survivor, Andy Puddicombe, founder of the mindfulness app 'Headspace', says mindfulness enables us to recognise the patterns of negative thinking that a cancer diagnosis can bring about- such as depressive or anxious thoughts - and embrace them rather than be overwhelmed by them.

Yet despite advocates of mindfulness extolling its virtues, there has been a recent backlash against it. One criticism levelled at mindfulness is that, conversely to what has been claimed, it may actually be causing anxiety and depression. The Guardian newspaper recently published the story of a woman who, while attending a three-day mindfulness retreat, experienced panic attacks that continued throughout the retreat and long after, eventually leading her to a nervous breakdown and a spell in a psychiatric ward. And it seems this is not an isolated case. Psychologist Miguel Farias and Catherine Wikholm, who in their book 'The Buddha Pill' explore the adverse effects of mindfulness, have seen numerous accounts of people suffering panic attacks, feelings of dissociation, or hearing voices as a product of their mindfulness practice.

Along with the validity of the practice itself, opponents of mindfulness have begun questioning the motivation of many employers and experts who champion its benefits. Will Davies, senior lecturer at Goldsmiths and author of 'The Happiness Industry', claims our mental health has become a huge money-making opportunity. “Companies are increasingly aware of the financial costs that stress, depression and anxiety saddle them with,” he says and, as such, are shifting the responsibility onto the individual by encouraging their employees to meditate and attend relaxation sessions. In doing so, Davies argues they are placing any blame for mental health problems on the individual.

This criticism has been acknowledged by some of the leading proponents of mindfulness. Jon Kabat-Zinn states, “As critics are correct to point out, a real understanding of the subtlety of mindfulness is required if it is to be taught effectively: it can never be a quick fix. Some argue that for certain opportunistic elements, mindfulness has become a business that can only disappoint the vulnerable consumers who look to it as a panacea.” He believes the answer is not to reject mindfulness but to increase funding to provide the necessary evidence to establish and disseminate best practice, train teachers, and identify and support those most in need of mindfulness.`,
        blocks: [
          {
            type: "tfng",
            title: "Questions 1 - 6",
            instructions: [
              "Do the statements agree with the information given in Reading Passage 1, Mindfulness?",
              "In answer boxes 1 - 6, write:",
              "TRUE if the statement agrees with the information",
              "FALSE if the statement contradicts the information",
              "NOT GIVEN if there is no information on this in the reading passage"
            ],
            items: [
              { q: 1, text: "Mindfulness is a relatively new topic of study." },
              { q: 2, text: "The original practice of mindfulness differed from its current application." },
              { q: 3, text: "Jon Kabat-Zinn came from a religious background." },
              { q: 4, text: "Kabat-Zinn's clinic aimed to help people with a range of problems." },
              { q: 5, text: "Mindfulness enables people to increase their fight or flight response." },
              { q: 6, text: "Kabatt-Zinn believes criticism of Western mindfulness practice is unjustified." }
            ]
          },
          {
            type: "sentenceGaps",
            title: "Questions 7 - 13",
            instructions: [
              "Complete the summary.",
              "Use NO MORE THAN TWO WORDS from Reading Passage 1, Mindfulness, for each answer.",
              "Write them in answer boxes 7 - 13."
            ],
            items: [
              { q: 7, text: "Mindfulness has been proven to have a positive impact on people’s wellbeing. One study in 2013 showed patients responding positively to", tail: " involving mindfulness." },
              { q: 8, text: "This is due to a reduction in the size of the", tail: ", which makes us react to danger." },
              { q: 9, text: "Mindfulness can also help cancer patients with negative emotions following", tail: "." },
              { q: 10, text: "Many companies are dealing with their workers’ mental health issues by making", tail: " responsible for mental well-being." },
              { q: 11, text: "Two writers give many examples of the", tail: " of mindfulness." },
              { q: 12, text: "While the practice is intended to reduce", tail: " and depression, some argue that it may be the cause of those conditions." },
              { q: 13, text: "Jon Kabat-Zinn sees mindfulness's current shortfalls being a need for", tail: " and lack of funding." }
            ]
          }
        ]
      },
      {
        id: "part2",
        passageText: `BEHIND THE TIMES

From observations of the moon’s phases to the introduction of the quartz crystal - regardless of our ever-improving capacity to measure time, its fundamental nature remains an enigma. Despite this intangible intrigue, we must accept time as the driver of our lives. It can be found everywhere that man is, and increasingly pursues him on his daily route - on his wrist, in his pocket, possibly even, in the not-too-distant future, on his retina. Our awareness of time dictates how we live, eat, work, sleep and feel. But how and why did our world become so obsessed with time?

You might be surprised to learn that time as we know it - a precise measurement structured into ordered geographic zones of regular intervals - is a relatively recent phenomenon. If you went back as few as two or three centuries, you would find the human experience of time to be quite different, especially if your time travel was followed by travel of the traditional variety. For example, whereas now London and Bristol - approximately 100 miles apart - share the exact same time, Bristol of the early 1800s was approximately ten minutes behind the capital.

To understand this leap better, let me start by painting a picture of early Enlightenment Britain. For the most part, and certainly relative to the Britain of today, the country was rather disconnected. There were, of course, roads connecting all settlements regardless of size, but because journeys between them were slow there was little call for exact measurements of duration. Besides, each little town kept its own time, based on its own astronomical observations - specifically the location of the sun throughout the day - and thus kept their own slow pace.

This pace began to quicken around the turn of the nineteenth century. As industrial centres ‘blossomed’ far from London, so the need for improved transport links to facilitate trade became more urgent. With the introduction of railroads, the journey to our familiar ‘small world’ had begun. To assist the increasingly confused travellers, who were forced to re-adjust their watches at every station, a standard British time based upon the yearly average time the sun crossed the Greenwich Meridian was introduced. By 1855, 98% of British clocks had been set to this time.

While Greenwich’s role in establishing the concept of time standardisation was crucial, the diminutive size of the country meant that the problems Britain had faced were solved by this simple development. Across the Atlantic, American infrastructure and industry were expanding so fast and on such scale that further adaptations had to be made. The introduction of 100 railroad time zones, while a step in the right direction, was only a partial solution and as trains became more rapid, so safety concerns become greater - with many trains sharing a single track, exact time became critical.

On November 18, 1883, the United States and Canada introduced five standard time zones. The exception was Detroit, who chose to continue using a local time basis until 1900, when the City Council gave in and prepared to follow Central Standard Time. Even then, though, there remained problems. Half of the city’s businesses obeyed, but many individuals refused, citing what they saw as the ‘dehumanising effect’ of exact time. Incredibly, this reluctance to standardise influenced the City Council to revert to its original solar time. However, it wasn’t long until pressure from railway companies forced them to re-adapt.

Not long after the establishment of time zones in North America, interest began to emerge for a standardised system worldwide, largely due to the booming shipping industry, which found itself in a situation not unlike that of the aforementioned railroads. They needed to agree upon just one prime meridian - a global standard. A number of meridians had been used for longitudinal references in the late 1800s but that in Greenwich became almost universally accepted at the International Meridian Conference in 1884. The reasons for this near-unanimity included the fact that an incredible 72% of the world’s commerce was reliant on sea-charts based around the Greenwich Meridian.

However, the French fervently refused to acknowledge the decision, instead establishing their meridian within Paris until 1911. Rather than suffer the indignity of giving in to their fierce historical rivals, they finally succumbed to using Greenwich Mean Time (later renamed as Coordinated Universal Time (UTC)) but retained national pride by labelling it as ‘Paris Mean Time minus 9 minutes and 21 seconds’. Not long after, France switched to Central European Time and has remained as such ever since.

From the 1920s, the recognition and official registration of time zones spread throughout the world, culminating in Nepal’s 1986 adoption of UTC + 5:45. We now have 24 standard meridians of longitude, 15 degrees apart, with which we structure our days. The concept is vital for our co-operation and commerce, which together form the driving force of the modern world. It is, however, important to recognise just how quickly this change has occurred - it is incredible to think that little over a century ago, the majority would have been comfortable referring to time simply as ‘morning’, ‘afternoon’, ‘evening’ and ‘night’. Might those resolute citizens of Detroit have had a point?`,
        blocks: [
          {
            type: "sentenceGaps",
            title: "Questions 14 - 20",
            instructions: [
              "Complete the sentences.",
              "Use NO MORE THAN TWO WORDS from Reading Passage 2, Behind the Times, for each answer.",
              "Write them in answer boxes 14 - 20."
            ],
            items: [
              { q: 14, text: "Before the introduction of modern time zones, Bristol and London were", tail: " apart." },
              { q: 15, text: "Due to the length of journeys in 18th century Britain,", tail: " of time were unnecessary." },
              { q: 16, text: "People used to use", tail: " to measure time in each individual settlement." },
              { q: 17, text: "British standard time became necessary as more", tail: " were built." },
              { q: 18, text: "Britain didn’t need to adapt different time zones because of its", tail: "." },
              { q: 19, text: "Faster trains led to increased", tail: " over the number of vehicles on one line." },
              { q: 20, text: "Despite previous attempts to change the time system, it was ultimately", tail: " that made Detroit adopt Central Standard Time." }
            ]
          },
          {
            type: "mcq",
            title: "Questions 21 - 24",
            instructions: [
              "Choose the correct letter, A, B, C or D.",
              "Write the appropriate letters, A - D, in answer boxes 21 - 24."
            ],
            items: [
              {
                q: 21,
                text: "What was the main factor which drove the need for global time standardisation?",
                choices: {
                  A: "The need to do business with North America",
                  B: "The decline in the use of trains",
                  C: "The rapid expansion of sea trade",
                  D: "The number of different meridians was causing confusion"
                }
              },
              {
                q: 22,
                text: "Which is one of the reasons given for Greenwich being accepted as the global standard meridian?",
                choices: {
                  A: "The USA was in the same time zone as Greenwich",
                  B: "Greenwich Observatory was conducting the best research on time",
                  C: "The 1884 Conference was held in Greenwich",
                  D: "The majority of trade depended on maps that used the Greenwich Meridian"
                }
              },
              {
                q: 23,
                text: "According to the writer, why did France initially refuse to adopt Greenwich as their meridian?",
                choices: {
                  A: "Paris was nearly ten minutes ahead of Greenwich",
                  B: "The French were too proud to accept a British system",
                  C: "The decision to use Greenwich was made without French knowledge",
                  D: "They already had their own system which they had used for a long time"
                }
              },
              {
                q: 24,
                text: "According to the writer, what might the inhabitants of Detroit have been right about?",
                choices: {
                  A: "Exact time making us feel less human",
                  B: "Our need for precise time measurement for trade",
                  C: "Time standardisation happening too quickly",
                  D: "Days being much simpler when divided into only four time periods"
                }
              }
            ]
          },
          {
            type: "multiTextChoices",
            title: "Questions 25 - 27",
            instructions: [
              "Which THREE statements are true of the writer’s opinion?",
              "Choose THREE correct letters (from A - G) and write them in any order in answer boxes 25 - 27."
            ],
            choices: [
              { letter: "A", text: "Knowing what the time is affects our behaviour." },
              { letter: "B", text: "The idea of measuring time started in the 19th Century." },
              { letter: "C", text: "The standardisation of time zones caused the rise of industry in America and Britain." },
              { letter: "D", text: "Time zones are essential for humans to work and trade together." },
              { letter: "E", text: "Some day, we may have clocks in our eyes." },
              { letter: "F", text: "Humanity is close to understanding how time works." },
              { letter: "G", text: "Most people have responded positively to the introduction of global time systems." }
            ],
            items: [
              { q: 25, text: "Writer opinion answer 1" },
              { q: 26, text: "Writer opinion answer 2" },
              { q: 27, text: "Writer opinion answer 3" }
            ]
          }
        ]
      },
      {
        id: "part3",
        passageText: `ONKALO

Despite nuclear energy generally being considered an environmentally friendly source of electricity, the radioactive waste it leaves remains hazardous to life for at least 100,000 years. What to do with this unwanted by-product and how to protect people and the environment from it is a major challenge facing the proponents of nuclear power generation. Currently, it is mostly stored in cool water, which acts as a seal for the radiation, in facilities requiring round-the-clock guarding, surveillance, and maintenance. This may be an effective storage method for now, however, a solution is needed for the next hundred millennia and so scientists have been researching one.

In a remote area on the west coast of Finland, there may be an answer: Onkalo. Currently under construction, this spent nuclear fuel repository located at the Olkiluoto Nuclear Power Plant in the municipality of Eurajoki is where they plan to bury this nuclear waste 500 metres below ground in the most secure and stable environment known: the bedrock. While above ground there are wars, natural disasters, the rise and fall of civilisations, the bedrock below remains unchanged for millions of years. This stability, argue scientists, makes it ideal for toxic material disposal. After intense screening of possible sites in the Finnish territory, this location was chosen due to the estimated lower geographical and environmental impact it would cause, as well as taking into consideration the consent of the local community. Construction began in 2004 and is expected to be finished in 2100, when Onkalo will be sealed, hopefully never to be opened again.

Onkalo means ‘hiding place’ or ‘cavity’ in Finnish, and will live up to its name. On a flat stretch of pine-tree-covered land, kilometres from the nearest town, Rauma, on Olkiluoto Island, stands an unprepossessing metal shutter set between walls of rock. From this entrance, a tunnel will snake down five kilometres, 500m into the depths of the earth, ending in tomb-like storage capsules. Nothing like Onkalo has been attempted by humanity before. The facility must last, undisturbed, for 100,000 years – an unimaginably long time, far longer than any other manmade structure so far. The Giza Pyramids, for example, currently the world’s oldest free-standing buildings, have yet to reach the 5000 year mark, a mere one-twentieth of the time Onkalo must withstand.

The main purpose of Onkalo is to keep future generations safe from the lethal waste buried within. It is ironic, then, that the main threat to the facility’s security is the very people it aims to protect. Scientists are concerned about future generations finding and opening Onkalo, and perhaps not understanding what they come across. These future generations are essentially unknowable. While it may be possible to predict the nature of people in a hundred years, Onkalo has to consider them in 1,000, 10,000, 100,000 years. The future becomes very foggy when thinking in these timescales and so, when thinking of the future, scientists often look to the past first. Considering 100,000 years ago Neanderthals still walked the Earth, it stands to reason that in another 100,000 people will be unimaginably different from us now. They may have more advanced technology, or, is it possible some disaster will have led them to lose it entirely? Is it equally possible that such poor environmental conditions mean life is only possible underground, or only on other planets? Future generations may interpret Onkalo as something religious, a burial ground, a hidden treasure. The human race could have ceased to exist at all.

There are many conflicting ideas about how to tackle this potential problem. One of the fiercest debates is whether to leave warnings for future generations in the form of markers. These would be penned in all major UN languages plus pictographs engraved in stone monoliths around the site. But others point out that anybody able to heed the warning may have died long before these messages were ever discovered. Even pictographs, which we instinctively feel are universal, may be interpreted differently in 50,000 years. More outlandish ideas include covering the ground above Onkalo with a concrete forest of enormous thorns, to make the area as foreboding as possible. Also, the very existence of markers may stoke people’s curiosity, driving them to want to find out what has been hidden. Could talk of Onkalo have become mythical, a legend similar to the Lost City of Atlantis, or would future generations even be familiar with the nature of nuclear waste, possibly having invented new energy sources? Again, we can connect to the past and the discovery of ancient Egyptian tombs; these were covered in warnings to leave well alone that were either not understood or completely disregarded. There is no reason to think the people of the future would be any different. This has led many scientists to conclude no markers should be left and that Onkalo should simply be sealed, covered, and forgotten.

Onkalo may very well end up being the longest lasting trace of Western civilisation, yet it will not be a thing of wonder like the Pyramids. It is something that must never be opened, for the safety of the future, though the Ancient Egyptians thought similarly and the deterrents they left were ultimately ignored. Despite the question of whether the past can help us to predict the future remaining moot, the need for a place like Onkalo leaves one with a certain feeling of ambivalence towards nuclear energy. This waste that comes as part and parcel of generating electricity in this manner is, for many, too high a price to pay.`,
        blocks: [
          {
            type: "sentenceGaps",
            title: "Questions 28 - 32",
            instructions: [
              "Complete the notes.",
              "Use NO MORE THAN TWO WORDS from Reading Passage 3, Onkalo.",
              "Write them in answer boxes 28 - 32."
            ],
            items: [
              { q: 28, text: "Ideal as", tail: " is durable and consistent over millennia." },
              { q: 29, text: "Site selected taking into account its effect on ecology and approval by the", tail: "." },
              { q: 30, text: "Deep passage leads down to", tail: "." },
              { q: 31, text: "Covering the area in a number of large artifical", tail: " is one idea to keep future civilizations away." },
              { q: 32, text: "Onkalo could arouse the curiosity of future peoples, though they may not understand what", tail: " is." }
            ]
          },
          {
            type: "endingsMatch",
            title: "Questions 33 - 37",
            instructions: [
              "Complete each sentence with the correct ending, A - H.",
              "Write the appropriate letters, A - H, in answer boxes 33 - 37."
            ],
            endings: {
              A: "... involves digging deep into the earth.",
              B: "... calls for careful consideration of the site's protection.",
              C: "... involves storing it in cold water.",
              D: "... suggests the extinction of the human race.",
              E: "... calls for a retrospective view from scientists.",
              F: "... relates to those it is designed to safeguard.",
              G: "... presumes a threat to the future of nuclear power.",
              H: "... assumes the similarity of future humans to us."
            },
            items: [
              { q: 33, text: "The current method of dealing with nuclear waste ..." },
              { q: 34, text: "The Onkalo solution ..." },
              { q: 35, text: "The principal risk to the protection of Onkalo ..." },
              { q: 36, text: "The unforeseeable nature of future civilizations ..." },
              { q: 37, text: "The idea by some scientists to hide Onkalo completely ..." }
            ]
          },
          {
            type: "tfng",
            title: "Questions 38 - 40",
            instructions: [
              "Do the statements agree with the claims of the writer of Reading Passage 3, Onkalo?",
              "In answer boxes 38 - 40 write:",
              "YES if the statement agrees with the writer",
              "NO if the statement contradicts the writer",
              "NOT GIVEN if it is impossible to say what the writer thinks about this"
            ],
            items: [
              { q: 38, text: "As a permanent testimony to our civilisation, Onkalo may well be revered by future inhabitants of the earth." },
              { q: 39, text: "Examining historical events to predict future ones is a debatable practice." },
              { q: 40, text: "The future of nuclear power production is uncertain due to increasing costs." }
            ]
          }
        ]
      }
    ]
  }
};

export const PROTECTED_TEST_CONTENT = {
  ielts1: test1,
  ielts2: test2,
  ielts3: test3,
  ielts4: test4,
  ielts5: test5,
  ielts6: test6,
  ielts7: test7,
  ielts8: test8,
  ielts9: test9,
  ielts10: test10,
  ielts11: test11,
  ielts12: test12,
  ielts13: test13,
};

export function getProtectedTestContent(testId) {
  return PROTECTED_TEST_CONTENT[String(testId || '').trim()] || null;
}
