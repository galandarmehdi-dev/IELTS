/* assets/js/tests/test5Content.js */
(function () {
  "use strict";

  window.IELTS = window.IELTS || {};
  window.IELTS.Registry = window.IELTS.Registry || {};
  const R = window.IELTS.Registry;

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

A Education has become one of Finland's biggest success stories in the past few decades. Finnish 15-year-olds score near the top of international rankings in reading, maths and science, yet only a small proportion of children receive private tuition and there is little emphasis on competition between schools. Researchers looking for the reasons behind this success often point to broad social policies, but they also note features inside the school system itself.

B One explanation is that the country sees education as closely tied to national development. After the Second World War, Finland invested in a system intended to support social equality and long-term economic growth. School reform was seen as a route to a stronger economy, and education policy was designed with national needs in mind rather than short-term political advantage.

C Children in Finland begin formal schooling later than in many countries, yet they are supported early through well-designed pre-school provision and health services. When they do start school, the curriculum is framed by national guidelines but teachers have the freedom to adjust lessons to the needs of their classes. There is less standardised testing than in many systems, so teachers can focus more on understanding than memorisation.

D Teacher quality is another key factor. Teaching is a respected profession, and entry to teacher-training programmes is competitive. Primary teachers are expected to hold a masters degree, and the training they receive combines theory with practical classroom experience. Because teachers are trusted, they are given considerable professional autonomy.

E Schools are also well resourced. Classrooms usually have good equipment, and schools receive support services that make it easier to identify learning difficulties early. Instead of ranking students constantly, schools are more likely to offer targeted help when problems appear. This reduces pressure on children and allows schools to respond before small issues grow.

F Finally, social respect for teachers matters. Parents and students tend to view teachers as professionals whose judgement should be taken seriously. This status helps schools function more smoothly and reduces conflict over everyday decisions. The Finnish case suggests that school success depends not on one dramatic reform but on a combination of social values, training, trust and long-term planning.`,
          blocks: [
            {
              type: "headings",
              title: "Questions 1-6",
              instructions: [
                "Reading Passage 1 has six paragraphs, A-F.",
                "Choose the correct heading for each paragraph from the list of headings below.",
              ],
              listTitle: "List of Headings",
              headings: [
                { value: "i", label: "Flexible teaching within a national framework" },
                { value: "ii", label: "Professional respect in the wider community" },
                { value: "iii", label: "Early links between education and national ambition" },
                { value: "iv", label: "Practical support for pupils with difficulties" },
                { value: "v", label: "An overview of a high-performing system" },
                { value: "vi", label: "Selective entry into teacher education" },
                { value: "vii", label: "A tradition of strict school ranking" },
                { value: "viii", label: "Educational reform as economic strategy" },
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
                "Choose NO MORE THAN TWO WORDS from the passage for each answer.",
              ],
              items: [
                { q: 7, text: "Strong school performance is often linked to national progress in", tail: "" },
                { q: 8, text: "Education policy was designed to strengthen the", tail: "" },
                { q: 9, text: "The curriculum is shaped by national", tail: "" },
                { q: 10, text: "Teachers can adapt lessons to classroom needs instead of relying mainly on", tail: "" },
                { q: 11, text: "Schools often have good", tail: " in classrooms" },
                { q: 12, text: "Primary teachers are expected to have a", tail: "" },
                { q: 13, text: "Teachers benefit from the", tail: " given by society" },
              ],
            },
          ],
        },
        {
          id: "part2",
          passageText: `The Magic of Kefir

A Kefir is a fermented milk drink that has been consumed for centuries in parts of Eastern Europe, Russia and Central Asia. It has a sharp flavour and a slightly effervescent quality that distinguishes it from ordinary yogurt. Interest in kefir has expanded internationally in recent years as consumers have become more interested in gut health and probiotic foods.

B Traditional kefir is produced by adding kefir grains to milk. These grains are not cereal grains but clusters made up of bacteria and yeasts living together in a protein-and-sugar matrix that resembles tiny cauliflower rosettes. When added to milk, the organisms begin a complex process of fermentation.

C During fermentation, the microorganisms feed on milk sugars and produce lactic acid, carbon dioxide and trace amounts of alcohol. This changes the flavour and texture of the drink. Because several different organisms are involved, kefir can become more biologically diverse than many other fermented dairy products.

D Some people find the fermentation process a little unsettling at first because it appears unpredictable. In practice, however, kefir-making follows clear patterns if temperature and timing are controlled. Household producers often reuse the grains many times, allowing them to multiply between batches.

E The result is a drink that many people describe as halfway between milk and liquefied yogurt. Some modern producers also experiment with flavouring or with using plant-based alternatives, but traditional kefir remains associated with cow's or goat's milk.

F Researchers are interested in kefir because of the possible health benefits linked to fermented foods. Some studies suggest that the drink may support digestive balance and improve tolerance of some dairy products, though scientists warn that not every claimed benefit has been proven conclusively.

G The spread of kefir into supermarkets has created new commercial opportunities, but it has also raised questions about authenticity. Industrial versions may not reproduce the full complexity of traditional fermentation methods, which depend heavily on living grains and careful handling.`,
          blocks: [
            {
              type: "headings",
              title: "Questions 14-20",
              instructions: [
                "Reading Passage 2 has seven sections, A-G.",
                "Choose the correct heading for each section from the list of headings below.",
              ],
              listTitle: "List of Headings",
              headings: [
                { value: "i", label: "Commercial growth and concerns about authenticity" },
                { value: "ii", label: "A drink with growing global interest" },
                { value: "iii", label: "Why some people find production surprising" },
                { value: "iv", label: "The structure of kefir grains" },
                { value: "v", label: "Scientific doubts about all health claims" },
                { value: "vi", label: "What happens during fermentation" },
                { value: "vii", label: "How the final product is often described" },
                { value: "viii", label: "Research interest in possible benefits" },
                { value: "ix", label: "An ancient method no longer used" },
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
                "Answer the questions below.",
                "Choose NO MORE THAN TWO WORDS from the passage for each answer.",
              ],
              questions: [
                { q: 21, text: "What do kefir grains resemble visually?" },
                { q: 22, text: "What phrase describes the process that may worry beginners?" },
                { q: 23, text: "What do the microorganisms feed on during fermentation?" },
                { q: 24, text: "What dairy product is kefir sometimes compared with?" },
              ],
            },
            {
              type: "multiTextChoices",
              title: "Questions 25-26",
              instructions: [
                "Choose TWO letters, A-E.",
                "Which TWO points are NOT stated as certain facts in the passage?",
              ],
              choices: [
                { letter: "A", text: "Kefir is traditionally made with living grains." },
                { letter: "B", text: "All claimed health benefits of kefir have been scientifically proven." },
                { letter: "C", text: "Industrial production may reduce complexity." },
                { letter: "D", text: "Kefir has become more popular internationally." },
                { letter: "E", text: "Plant-based versions are now impossible to produce." },
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

A Before the Swiffer became a major household brand, floor cleaning had changed very little for decades. Consumers still relied mainly on brooms, mops and dustpans. These tools were familiar, but they were often inconvenient, and many people were not especially satisfied with the results.

B Researchers at Procter & Gamble began paying closer attention to everyday cleaning habits. Instead of focusing only on product chemistry, they watched how people actually cleaned their homes and workplaces. They found that sweeping often moved dust around rather than capturing it, while wet mops could leave dirty water behind.

C This close observation helped the company see an opportunity. Consumers did not necessarily want a more powerful mop; they wanted something easier, cleaner and quicker. The idea that emerged was a lightweight cleaning tool combined with disposable cloths that would attract and hold dirt.

D The eventual product, Swiffer, was therefore not just a new object but a new system. It combined a handle, a flat base and specially designed cloths. The cloths were meant to trap debris more effectively than a broom, while the overall design made it easier to clean awkward spaces.

E One reason for the product's success was the way the company interpreted the role of weak signals from consumers. People did not always complain directly about traditional cleaning tools, but their behaviour revealed frustration. By studying these small patterns of dissatisfaction, the company could identify a market opportunity before many consumers themselves could describe it clearly.

F Marketing also mattered. The company positioned Swiffer not only as a cleaner product but as a simpler lifestyle solution. Advertising focused on convenience and speed, and the product was introduced in a way that encouraged people to rethink what floor cleaning could look like.

G The story of Swiffer is often used in business schools because it shows how innovation can come from careful observation of routine behaviour. Instead of waiting for consumers to demand a specific invention, companies can identify unmet needs by studying habits, conversations and small inconveniences.

H Critics, however, note that disposable cleaning systems raise environmental questions. Convenience may increase waste, and some argue that product design should take longer-term sustainability into account alongside ease of use.

I Even so, Swiffer remains a useful case study in innovation. It illustrates how businesses can translate ordinary frustrations into profitable new products by combining behavioural research, product design and effective marketing.`,
          blocks: [
            {
              type: "mcq",
              title: "Questions 27-30",
              instructions: [
                "Choose the correct letter, A, B, C or D.",
              ],
              items: [
                {
                  q: 27,
                  text: "Before Swiffer was launched, cleaning tools were mainly",
                  choices: {
                    A: "widely admired for their design",
                    B: "replaced frequently by new inventions",
                    C: "used mostly in workplaces",
                    D: "similar to long-established products",
                  },
                },
                {
                  q: 28,
                  text: "The company developed the product after it",
                  choices: {
                    A: "copied a rival's technology",
                    B: "observed real cleaning behaviour closely",
                    C: "received government funding",
                    D: "tested only laboratory data",
                  },
                },
                {
                  q: 29,
                  text: "The passage suggests consumers wanted cleaning to be",
                  choices: {
                    A: "easier and more efficient",
                    B: "more expensive and specialised",
                    C: "more physically demanding",
                    D: "less dependent on cloths",
                  },
                },
                {
                  q: 30,
                  text: "Paragraph F mainly emphasises the importance of",
                  choices: {
                    A: "factory efficiency",
                    B: "store layout",
                    C: "marketing strategy",
                    D: "scientific controversy",
                  },
                },
              ],
            },
            {
              type: "endingsMatch",
              title: "Questions 31-34",
              instructions: [
                "Complete each sentence with the correct ending, A-G.",
              ],
              endings: {
                A: "it can reduce frustration in daily routines.",
                B: "the company watched people in everyday contexts.",
                C: "it was designed to replace all existing products immediately.",
                D: "it can emerge from unnoticed habits and small problems.",
                E: "environmental concerns may be overlooked.",
                F: "the product failed to appeal to consumers.",
                G: "most consumers demanded it explicitly from the start.",
              },
              items: [
                { q: 31, text: "Research was effective because" },
                { q: 32, text: "The Swiffer case suggests innovation often succeeds when" },
                { q: 33, text: "One criticism of disposable systems is that" },
                { q: 34, text: "The product's success showed that" },
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
                { q: 35, text: "Researchers examined cleaning habits at home and in the", tail: "" },
                { q: 36, text: "They realised weak ties and casual", tail: " could reveal useful needs" },
                { q: 37, text: "The product encouraged different cleaning", tail: " among users" },
                { q: 38, text: "The case is often discussed in business schools because it links innovation to the study of ordinary", tail: "" },
                { q: 39, text: "Critics say convenience can increase material", tail: "" },
              ],
            },
            {
              type: "mcq",
              title: "Question 40",
              instructions: ["Choose the correct letter, A, B, C or D."],
              items: [
                {
                  q: 40,
                  text: "Which title best describes Reading Passage 3?",
                  choices: {
                    A: "How observation helped create a new cleaning product",
                    B: "Why traditional brooms are still the best",
                    C: "A history of industrial floor design",
                    D: "The science of household chemicals",
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  };

  if (R.TESTS && R.TESTS.byId && R.TESTS.byId.ielts5) {
    R.TESTS.byId.ielts5.content = test5;
  }
})();
