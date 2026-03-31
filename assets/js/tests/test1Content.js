/* assets/js/tests/test1Content.js */
(function () {
  "use strict";

  window.IELTS = window.IELTS || {};
  window.IELTS.Registry = window.IELTS.Registry || {};
  const R = window.IELTS.Registry;

  const readingLegacyFactory = function (H) {
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

  if (R.TESTS && R.TESTS.byId && R.TESTS.byId.ielts1) {
    R.TESTS.byId.ielts1.content = R.TESTS.byId.ielts1.content || {};
    R.TESTS.byId.ielts1.content.listening = {
      audioSrc: "https://audio.ieltsmock.org/listening_tp_part1.mp3",
      html: "<!-- PAGE 1 -->\n<div class=\"listen-page\" id=\"listenSec1\">\n<div class=\"listen-block\">\n<div class=\"listen-h\">SECTION 1 \u2014 Questions 1\u201310</div>\n<div class=\"listen-inst\">\n              Complete the notes/table below. Write <b>NO MORE THAN TWO WORDS AND/OR A NUMBER</b> for each answer.\n              Write your answers <b>in the gaps</b>.\n            </div>\n<div class=\"listen-card\">\n<div class=\"listen-card-title\">Transport from Bayswater</div>\n<div class=\"listen-example\">\n<div><b>Example</b></div>\n<div>Destination: <b><i>Harbour City</i></b></div>\n</div>\n<div class=\"listen-notes\">\n<div class=\"note-row\"><span class=\"qnum\">1</span> Express train leaves at <input class=\"l-input\" data-lq=\"1\"/>.</div>\n<div class=\"note-row\"><span class=\"qnum\">2</span> Nearest station is <input class=\"l-input\" data-lq=\"2\"/>.</div>\n<div class=\"note-row\"><span class=\"qnum\">3</span> Number 706 bus goes to <input class=\"l-input\" data-lq=\"3\"/>.</div>\n<div class=\"note-row\"><span class=\"qnum\">4</span> Number <input class=\"l-input small\" data-lq=\"4\"/> bus goes to station.</div>\n<div class=\"note-row\"><span class=\"qnum\">5</span> Earlier bus leaves at <input class=\"l-input\" data-lq=\"5\"/>.</div>\n</div>\n</div>\n<div class=\"listen-card\">\n<div class=\"listen-card-title\">Questions 6\u201310</div>\n<div class=\"listen-table-wrap\">\n<table class=\"listen-table\">\n<thead>\n<tr>\n<th>Transport</th>\n<th>Cash fare</th>\n<th>Card fare</th>\n</tr>\n</thead>\n<tbody>\n<tr>\n<td>Bus</td>\n<td>$ <span class=\"qnum\">6</span> <input class=\"l-input tiny\" data-lq=\"6\"/></td>\n<td>$1.50</td>\n</tr>\n<tr>\n<td>Train (peak)</td>\n<td>$10</td>\n<td>$10</td>\n</tr>\n<tr>\n<td>Train (off-peak)<br/>\n<span class=\"muted\">before 5pm or after <span class=\"qnum\">7</span> <input class=\"l-input tiny\" data-lq=\"7\"/> pm</span>\n</td>\n<td>$10</td>\n<td>$ <span class=\"qnum\">8</span> <input class=\"l-input tiny\" data-lq=\"8\"/></td>\n</tr>\n<tr>\n<td><span class=\"qnum\">9</span> <input class=\"l-input tiny\" data-lq=\"9\"/> ferry</td>\n<td>$4.50</td>\n<td>$3.55</td>\n</tr>\n<tr>\n<td>Tourist ferry (<span class=\"qnum\">10</span> <input class=\"l-input tiny\" data-lq=\"10\"/>)</td>\n<td>$35</td>\n<td>\u2013</td>\n</tr>\n<tr>\n<td>Tourist ferry (whole day)</td>\n<td>$65</td>\n<td>\u2013</td>\n</tr>\n</tbody>\n</table>\n</div>\n</div>\n</div>\n</div>\n<!-- PAGE 2 -->\n<div class=\"listen-page hidden\" id=\"listenSec2\">\n<div class=\"listen-block\">\n<div class=\"listen-h\">SECTION 2 \u2014 Questions 11\u201320</div>\n<div class=\"listen-card\">\n<div class=\"listen-card-title\">Questions 11\u201314</div>\n<div class=\"listen-inst\">Which counsellor should you see? Write the correct letter, <b>A, B or C</b>, in the gaps.</div>\n<div class=\"people-box\">\n<div><b>A</b> Louise Bagshaw</div>\n<div><b>B</b> Tony Denby</div>\n<div><b>C</b> Naomi Flynn</div>\n</div>\n<div class=\"note-row\"><span class=\"qnum\">11</span> if you do not have an appointment\n                <select class=\"l-select\" data-lq=\"11\">\n<option value=\"\"></option><option>A</option><option>B</option><option>C</option>\n</select>\n</div>\n<div class=\"note-row\"><span class=\"qnum\">12</span> if it is your first time seeing a counsellor\n                <select class=\"l-select\" data-lq=\"12\">\n<option value=\"\"></option><option>A</option><option>B</option><option>C</option>\n</select>\n</div>\n<div class=\"note-row\"><span class=\"qnum\">13</span> if your concerns are related to anxiety\n                <select class=\"l-select\" data-lq=\"13\">\n<option value=\"\"></option><option>A</option><option>B</option><option>C</option>\n</select>\n</div>\n<div class=\"note-row\"><span class=\"qnum\">14</span> if you are unable to see a counsellor during normal office hours\n                <select class=\"l-select\" data-lq=\"14\">\n<option value=\"\"></option><option>A</option><option>B</option><option>C</option>\n</select>\n</div>\n</div>\n<div class=\"listen-card\">\n<div class=\"listen-card-title\">Questions 15\u201320</div>\n<div class=\"listen-inst\">Complete the table below. Write <b>NO MORE THAN TWO WORDS</b> for each answer.</div>\n<div class=\"listen-table-wrap\">\n<table class=\"listen-table\">\n<thead>\n<tr>\n<th>Workshop</th>\n<th>Content</th>\n<th>Target group</th>\n</tr>\n</thead>\n<tbody>\n<tr>\n<td>Adjusting</td>\n<td>what you need to succeed academically</td>\n<td><span class=\"qnum\">15</span> <input class=\"l-input tiny\" data-lq=\"15\"/> students</td>\n</tr>\n<tr>\n<td>Getting Organised</td>\n<td>use time effectively, find <span class=\"qnum\">16</span> <input class=\"l-input tiny\" data-lq=\"16\"/> between study and leisure</td>\n<td>all students</td>\n</tr>\n<tr>\n<td>Communicating</td>\n<td>talking with staff, communicating across cultures</td>\n<td>all students, especially <span class=\"qnum\">17</span> <input class=\"l-input tiny\" data-lq=\"17\"/></td>\n</tr>\n<tr>\n<td>Anxiety</td>\n<td><span class=\"qnum\">18</span> <input class=\"l-input tiny\" data-lq=\"18\"/>, breathing techniques, meditation, etc.</td>\n<td>students about to sit exams</td>\n</tr>\n<tr>\n<td><span class=\"qnum\">19</span> <input class=\"l-input tiny\" data-lq=\"19\"/></td>\n<td>staying on track for long periods</td>\n<td><span class=\"qnum\">20</span> <input class=\"l-input tiny\" data-lq=\"20\"/> students only</td>\n</tr>\n</tbody>\n</table>\n</div>\n</div>\n</div>\n</div>\n<!-- PAGE 3 -->\n<div class=\"listen-page hidden\" id=\"listenSec3\">\n<div class=\"listen-block\">\n<div class=\"listen-h\">SECTION 3 \u2014 Questions 21\u201330</div>\n<div class=\"listen-inst\">Complete the notes below. Write <b>NO MORE THAN THREE WORDS</b> for each answer.</div>\n<div class=\"listen-card section3-notes\">\n<!-- BASIC INFO -->\n<div class=\"s3-group\">\n<div class=\"note-row\"><b>Novel:</b> <span class=\"qnum\">21</span> <input class=\"l-input\" data-lq=\"21\"/></div>\n<div class=\"note-row\"><b>Protagonists:</b> Mary Lennox; Colin Craven</div>\n<div class=\"note-row\"><b>Time period:</b> Early in <span class=\"qnum\">22</span> <input class=\"l-input\" data-lq=\"22\"/></div>\n<div class=\"note-row\">\n<b>Plot:</b> Mary \u2192 UK \u2014 meets Colin who thinks he\u2019ll never be able to\n      <span class=\"qnum\">23</span> <input class=\"l-input\" data-lq=\"23\"/>. They become friends.\n    </div>\n<div class=\"note-row\">\n<b>Point of view:</b> \u201cOmniscient\u201d \u2014 narrator knows all about characters\u2019 feelings, opinions and\n      <span class=\"qnum\">24</span> <input class=\"l-input\" data-lq=\"24\"/>.\n    </div>\n<div class=\"note-row\"><b>Audience:</b> Good for children \u2014 story simple to follow</div>\n</div>\n<!-- SYMBOLS -->\n<div class=\"s3-group\">\n<div class=\"note-row s3-title\">\n<b>Symbols</b> (physical items that represent\n      <span class=\"qnum\">25</span> <input class=\"l-input\" data-lq=\"25\"/>):\n    </div>\n<div class=\"note-row bullet\">\u2022 the robin redbreast</div>\n<div class=\"note-row bullet\">\u2022 <span class=\"qnum\">26</span> <input class=\"l-input\" data-lq=\"26\"/></div>\n<div class=\"note-row bullet\">\u2022 the portrait of Mistress Craven</div>\n</div>\n<!-- MOTIFS -->\n<div class=\"s3-group\">\n<div class=\"note-row s3-title\"><b>Motifs</b> (patterns in the story):</div>\n<div class=\"note-row bullet\">\u2022 the Garden of Eden</div>\n<div class=\"note-row bullet\">\n      \u2022 secrecy \u2014 metaphorical and literal transition from\n      <span class=\"qnum\">27</span> <input class=\"l-input\" data-lq=\"27\"/>\n</div>\n</div>\n<!-- THEMES -->\n<div class=\"s3-group\">\n<div class=\"note-row s3-title\"><b>Themes:</b> Connections between</div>\n<div class=\"note-row bullet\">\n      \u2022 <span class=\"qnum\">28</span> <input class=\"l-input\" data-lq=\"28\"/> and outlook\n    </div>\n<div class=\"note-row bullet\">\n      \u2022 <span class=\"qnum\">29</span> <input class=\"l-input\" data-lq=\"29\"/> and well-being\n    </div>\n<div class=\"note-row bullet\">\n      \u2022 individuals and the need for <span class=\"qnum\">30</span> <input class=\"l-input\" data-lq=\"30\"/>\n</div>\n</div>\n</div>\n</div>\n</div>\n<!-- PAGE 4 -->\n<div class=\"listen-page hidden\" id=\"listenSec4\">\n<div class=\"listen-block\">\n<div class=\"listen-h\">SECTION 4 — Questions 31–40</div>\n<div class=\"listen-card\">\n<div class=\"listen-card-title\">Questions 31–35</div>\n<div class=\"listen-inst\">Complete the table below. Write <b>ONE WORD ONLY</b> for each answer.</div>\n<div class=\"listen-card-title\">Time Perspectives</div>\n<div class=\"listen-table-wrap\">\n<table class=\"listen-table\">\n<thead>\n<tr><th>Time Zone</th><th>Outlook</th><th>Features &amp; Consequences</th></tr>\n</thead>\n<tbody>\n<tr>\n<td>Past</td>\n<td>Positive</td>\n<td>Remember good times, e.g. birthdays. Keep family records, photo albums, etc.</td>\n</tr>\n<tr>\n<td></td>\n<td><span class=\"qnum\">31</span> <input class=\"l-input tiny\" data-lq=\"31\"/></td>\n<td>Focus on disappointments, failures, bad decisions.</td>\n</tr>\n<tr>\n<td>Present</td>\n<td>Hedonistic</td>\n<td>Live for <span class=\"qnum\">32</span> <input class=\"l-input tiny\" data-lq=\"32\"/>; seek sensation; avoid pain.</td>\n</tr>\n<tr>\n<td></td>\n<td>Fatalistic</td>\n<td>Life is governed by <span class=\"qnum\">33</span> <input class=\"l-input tiny\" data-lq=\"33\"/>, religious beliefs, social conditions. Life’s path can’t be changed.</td>\n</tr>\n<tr>\n<td>Future</td>\n<td><span class=\"qnum\">34</span> <input class=\"l-input tiny\" data-lq=\"34\"/></td>\n<td>Prefer work to play. Don’t give in to temptation.</td>\n</tr>\n<tr>\n<td></td>\n<td>Fatalistic</td>\n<td>Have a strong belief in life after death and importance of <span class=\"qnum\">35</span> <input class=\"l-input tiny\" data-lq=\"35\"/> in life.</td>\n</tr>\n</tbody>\n</table>\n</div>\n</div>\n<div class=\"listen-card\">\n<div class=\"listen-card-title\">Questions 36–40</div>\n<div class=\"listen-inst\">Choose the correct letter, <b>A, B or C</b>.</div>\n<div class=\"mcq\">\n<div class=\"mcq-q\"><span class=\"qnum\">36</span> We are all present hedonists</div>\n<label class=\"mcq-opt\"><input type=\"radio\" name=\"q36\" value=\"A\" data-lq-radio=\"36\"/> A) at school</label>\n<label class=\"mcq-opt\"><input type=\"radio\" name=\"q36\" value=\"B\" data-lq-radio=\"36\"/> B) at birth</label>\n<label class=\"mcq-opt\"><input type=\"radio\" name=\"q36\" value=\"C\" data-lq-radio=\"36\"/> C) while eating and drinking</label>\n</div>\n<div class=\"mcq\">\n<div class=\"mcq-q\"><span class=\"qnum\">37</span> American boys drop out of school at a higher rate than girls because</div>\n<label class=\"mcq-opt\"><input type=\"radio\" name=\"q37\" value=\"A\" data-lq-radio=\"37\"/> A) they need to be in control of the way they learn</label>\n<label class=\"mcq-opt\"><input type=\"radio\" name=\"q37\" value=\"B\" data-lq-radio=\"37\"/> B) they play video games instead of doing school work</label>\n<label class=\"mcq-opt\"><input type=\"radio\" name=\"q37\" value=\"C\" data-lq-radio=\"37\"/> C) they are not as intelligent as girls</label>\n</div>\n<div class=\"mcq\">\n<div class=\"mcq-q\"><span class=\"qnum\">38</span> Present-orientated children</div>\n<label class=\"mcq-opt\"><input type=\"radio\" name=\"q38\" value=\"A\" data-lq-radio=\"38\"/> A) do not realise present actions can have negative future effects</label>\n<label class=\"mcq-opt\"><input type=\"radio\" name=\"q38\" value=\"B\" data-lq-radio=\"38\"/> B) are unable to learn lessons from past mistakes</label>\n<label class=\"mcq-opt\"><input type=\"radio\" name=\"q38\" value=\"C\" data-lq-radio=\"38\"/> C) know what could happen if they do something bad, but do it anyway</label>\n</div>\n<div class=\"mcq\">\n<div class=\"mcq-q\"><span class=\"qnum\">39</span> If Americans had an extra day per week, they would spend it</div>\n<label class=\"mcq-opt\"><input type=\"radio\" name=\"q39\" value=\"A\" data-lq-radio=\"39\"/> A) working harder</label>\n<label class=\"mcq-opt\"><input type=\"radio\" name=\"q39\" value=\"B\" data-lq-radio=\"39\"/> B) building relationships</label>\n<label class=\"mcq-opt\"><input type=\"radio\" name=\"q39\" value=\"C\" data-lq-radio=\"39\"/> C) sharing family meals</label>\n</div>\n<div class=\"mcq\">\n<div class=\"mcq-q\"><span class=\"qnum\">40</span> Understanding how people think about time can help us</div>\n<label class=\"mcq-opt\"><input type=\"radio\" name=\"q40\" value=\"A\" data-lq-radio=\"40\"/> A) become more virtuous</label>\n<label class=\"mcq-opt\"><input type=\"radio\" name=\"q40\" value=\"B\" data-lq-radio=\"40\"/> B) work together better</label>\n<label class=\"mcq-opt\"><input type=\"radio\" name=\"q40\" value=\"C\" data-lq-radio=\"40\"/> C) identify careless or ambitious people</label>\n</div>\n</div>\n</div>\n</div>\n<div class=\"listen-footer\">\n<div class=\"muted\" id=\"listenAutosave\">Autosave: ready</div>\n<button class=\"btn secondary\" id=\"downloadListeningBtn\" type=\"button\">Download Listening answers (JSON)</button>\n<button class=\"btn secondary\" id=\"copyListeningBtn\" type=\"button\">Copy Listening answers</button>\n<button class=\"btn\" id=\"submitListeningBtn\" type=\"button\">Submit Listening now</button>\n</div>"
    };
    R.TESTS.byId.ielts1.content.writing = {
      task1Type: "Mixed chart",
      task2Type: "Opinion essay",
      task1Html: "You should spend about 20 minutes on this task.<br/>\n            The graphs below give information about computer ownership as a percentage of the population between 2002 and 2010,\n            and by level of education for the years 2002 and 2010.<br/>\n            Summarise the information by selecting and reporting the main features, and make comparisons where relevant.<br/>\n<b>Write at least 150 words.</b>",
      task1ImageSrc: "https://static.wixstatic.com/media/6d9e77_cf5acdc4f237496ea2d3611301fe0319~mv2.jpg/v1/fill/w_568,h_650,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/6d9e77_cf5acdc4f237496ea2d3611301fe0319~mv2.jpg",
      task2Html: "You should spend about 40 minutes on this task.<br/><br/>\n            A person\u2019s worth nowadays seems to be judged according to social status and material possessions.\n            Old-fashioned values, such as honour, kindness and trust, no longer seem important.<br/>\n<b>To what extent do you agree or disagree with this opinion?</b><br/>\n            Give reasons for your answer and include any relevant examples from your own knowledge or experience.<br/>\n<b>Write at least 250 words.</b>",
      sampleAnswers: {
        task1: {
          bandScore: "Band 7.0",
          explanation: "This model gives a clear overview, highlights the main trends, and makes useful comparisons between education groups. It reaches Band 7 because the organization is strong and the language is mostly accurate, although the data commentary could be even more selective and precise.",
          sampleAnswer: `The graphs compare computer ownership in the population as a whole between 2002 and 2010 and show how ownership varied by level of education in 2002 and 2010.

Overall, computer ownership increased steadily over the period. It is also clear that people with higher levels of education were more likely to own a computer in both years, although all educational groups saw growth by 2010.

In the first graph, the proportion of people who owned a computer rose from just over half in 2002 to around three quarters in 2010. The increase was gradual and consistent, with no decline at any point during the period.

The second graph shows a clear connection between education and computer ownership. In 2002, the lowest ownership levels were among people without a high-school diploma, while postgraduates had the highest figure. By 2010, all groups had experienced growth. Ownership among the most educated groups rose to very high levels, while the least educated groups, although still lower overall, recorded some of the strongest gains. This suggests that computer access became much more widespread over time, even though educational background remained an important factor.`,
          correctedForm: `The graphs illustrate changes in computer ownership from 2002 to 2010 and compare ownership rates across education levels in 2002 and 2010.

Overall, computer ownership rose steadily throughout the period. In addition, ownership was consistently higher among better-educated people, although every educational group experienced an increase by 2010.

According to the first graph, the share of the population owning a computer grew from slightly above 50% in 2002 to roughly 75% in 2010. The trend was upward across the whole period.

The second graph indicates that education level had a strong impact on ownership. In 2002, people without a high-school diploma had the lowest rate, whereas postgraduates recorded the highest. By 2010, ownership had risen in all categories. The more highly educated groups remained at the top, but the lower educational groups also made noticeable progress. Overall, the data shows both expanding computer access and a continuing link between education and computer ownership.`
        },
        task2: {
          bandScore: "Band 7.5",
          explanation: "This essay presents a clear position, develops both sides sensibly, and supports the ideas with relevant reasoning. It fits the upper bands because the response is coherent and controlled, though a few arguments could be pushed slightly further for a stronger Band 8 performance.",
          sampleAnswer: `In modern society, many people appear to be valued according to their wealth, possessions and social position, while traditional qualities such as kindness, trust and honour seem less visible. I partly agree with this statement because material success has become an obvious measure of status, although I do not believe that moral values have lost their importance.

There is no doubt that modern life encourages people to judge others by external success. Social media, advertising and celebrity culture place great emphasis on income, luxury goods and lifestyle. As a result, expensive houses, fashionable brands and prestigious jobs are often seen as signs that someone is successful or important. In some cases, people form opinions about others before learning anything about their real character.

However, this does not mean that old-fashioned values have disappeared. In everyday life, trust, honesty and kindness are still essential. Families depend on them, friendships are built on them, and workplaces function more effectively when people act with integrity. During difficult times, people usually value those who are reliable and supportive rather than those who simply have status or money.

In my opinion, the main change is that traditional values are less visible in public life. Wealth can be displayed immediately, whereas character is revealed only through long-term behaviour. Because of this, society may seem more materialistic than it really is.

In conclusion, social status and possessions have become powerful ways of judging people in the modern world, but values such as honour, kindness and trust still define a person’s true worth in the long run.`,
          correctedForm: `Nowadays, many people seem to judge others by social status and material possessions rather than by qualities such as kindness, honour and trust. I partly agree, because visible success has become a powerful social signal, but I do not think traditional values are no longer important.

On the one hand, material success is often treated as a measure of personal worth. Media and online culture regularly present wealth, influence and luxury as proof of achievement. This encourages people to admire others for what they own rather than for how they behave.

On the other hand, traditional values still matter deeply in real life. Trust is essential in families and business, kindness strengthens communities, and honour shapes how people are remembered. When people face genuine difficulty, they usually depend on loyal and decent individuals rather than on those with the highest social position.

I believe the real difference is one of visibility. Status can be displayed instantly, while good character becomes clear only over time. For that reason, modern society may look more superficial than it actually is.

To conclude, social status and possessions have gained too much importance, but values such as trust, honour and kindness still remain the true basis of human worth.`
        }
      }
    };
    R.TESTS.byId.ielts1.content.reading = { legacyFactory: readingLegacyFactory };
  }
})();
