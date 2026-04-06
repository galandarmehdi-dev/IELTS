/* assets/js/tests/test6Content.js */
(function () {
  "use strict";

  window.IELTS = window.IELTS || {};
  window.IELTS.Registry = window.IELTS.Registry || {};
  const R = window.IELTS.Registry;

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
              type: "shortAnswer",
              title: "Questions 18-21",
              instructions: [
                "Complete the notes below.",
                "Choose NO MORE THAN TWO WORDS from the passage for each answer.",
              ],
              questions: [
                { q: 18, text: "What happens to whales' sound waves on shallow beaches?" },
                { q: 19, text: "What in the ocean can absorb whale clicks?" },
                { q: 20, text: "What kind of weather generates more bubbles than usual?" },
                { q: 21, text: "What is brought closer to the Australian coast in the climatic cycle described by Evans?" },
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

  if (R.TESTS && R.TESTS.byId && R.TESTS.byId.ielts6) {
    R.TESTS.byId.ielts6.content = test6;
  }
})();
