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
              <div class="listen-card-title">Questions 1-10</div>
              <div class="listen-inst">Complete the notes below. Write <b>ONE WORD AND/OR A NUMBER</b> for each answer.</div>
              <div class="listen-card-title">Holiday apartment booking</div>
              <div class="listen-notes">
                <div class="note-row">Customer is unhappy because the place is too <span class="qnum">1</span> <input data-lq="1" class="l-input"></div>
                <div class="note-row">Also says the area is very <span class="qnum">2</span> <input data-lq="2" class="l-input"></div>
                <div class="note-row">Weekly cost mentioned: <span class="qnum">3</span> <input data-lq="3" class="l-input tiny"></div>
                <div class="note-row">One common problem in the building involves <span class="qnum">4</span> <input data-lq="4" class="l-input"></div>
                <div class="note-row">Shared <span class="qnum">5</span> <input data-lq="5" class="l-input"> are also described as a problem</div>
                <div class="note-row">Tenant wants more information about local <span class="qnum">6</span> <input data-lq="6" class="l-input"></div>
                <div class="note-row">The landlord's name is <span class="qnum">7</span> <input data-lq="7" class="l-input"></div>
                <div class="note-row">Customer asks for a clean <span class="qnum">8</span> <input data-lq="8" class="l-input"></div>
                <div class="note-row">Breakfast is available in the <span class="qnum">9</span> <input data-lq="9" class="l-input"></div>
                <div class="note-row">One item in the flat is missing from the <span class="qnum">10</span> <input data-lq="10" class="l-input"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="listen-page hidden" id="listenSec2">
          <div class="listen-block">
            <div class="listen-h">SECTION 2 - Questions 11-20</div>
            <div class="listen-card">
              <div class="listen-card-title">Questions 11-14</div>
              <div class="listen-inst">Label the map below. Write the correct letter, <b>A-H</b>, next to Questions 11-14.</div>
              <div class="listen-notes">
                <div class="note-row"><span class="qnum">11</span> main reception <input data-lq="11" class="l-input tiny"></div>
                <div class="note-row"><span class="qnum">12</span> sports hall <input data-lq="12" class="l-input tiny"></div>
                <div class="note-row"><span class="qnum">13</span> café <input data-lq="13" class="l-input tiny"></div>
                <div class="note-row"><span class="qnum">14</span> science block <input data-lq="14" class="l-input tiny"></div>
              </div>
            </div>

            <div class="listen-card">
              <div class="listen-card-title">Questions 15-20</div>
              <div class="listen-inst">Choose the correct letter, <b>A, B or C</b>.</div>

              <div class="mcq">
                <div class="mcq-q"><span class="qnum">15</span> Students should register first at</div>
                <label class="mcq-opt"><input type="radio" name="q15" value="A" data-lq-radio="15"> A) the library desk</label>
                <label class="mcq-opt"><input type="radio" name="q15" value="B" data-lq-radio="15"> B) the information office</label>
                <label class="mcq-opt"><input type="radio" name="q15" value="C" data-lq-radio="15"> C) the sports centre</label>
              </div>

              <div class="mcq">
                <div class="mcq-q"><span class="qnum">16</span> The cheapest membership includes</div>
                <label class="mcq-opt"><input type="radio" name="q16" value="A" data-lq-radio="16"> A) evening access only</label>
                <label class="mcq-opt"><input type="radio" name="q16" value="B" data-lq-radio="16"> B) weekday access only</label>
                <label class="mcq-opt"><input type="radio" name="q16" value="C" data-lq-radio="16"> C) weekend classes</label>
              </div>

              <div class="mcq">
                <div class="mcq-q"><span class="qnum">17</span> The speaker says the new timetable was changed because of</div>
                <label class="mcq-opt"><input type="radio" name="q17" value="A" data-lq-radio="17"> A) staff shortages</label>
                <label class="mcq-opt"><input type="radio" name="q17" value="B" data-lq-radio="17"> B) student feedback</label>
                <label class="mcq-opt"><input type="radio" name="q17" value="C" data-lq-radio="17"> C) building repairs</label>
              </div>

              <div class="mcq">
                <div class="mcq-q"><span class="qnum">18</span> The art workshop will be held in</div>
                <label class="mcq-opt"><input type="radio" name="q18" value="A" data-lq-radio="18"> A) Room 2</label>
                <label class="mcq-opt"><input type="radio" name="q18" value="B" data-lq-radio="18"> B) Room 4</label>
                <label class="mcq-opt"><input type="radio" name="q18" value="C" data-lq-radio="18"> C) Room 7</label>
              </div>

              <div class="mcq">
                <div class="mcq-q"><span class="qnum">19</span> The speaker recommends bringing</div>
                <label class="mcq-opt"><input type="radio" name="q19" value="A" data-lq-radio="19"> A) a notebook</label>
                <label class="mcq-opt"><input type="radio" name="q19" value="B" data-lq-radio="19"> B) a water bottle</label>
                <label class="mcq-opt"><input type="radio" name="q19" value="C" data-lq-radio="19"> C) a student card</label>
              </div>

              <div class="mcq">
                <div class="mcq-q"><span class="qnum">20</span> What is the main purpose of the talk?</div>
                <label class="mcq-opt"><input type="radio" name="q20" value="A" data-lq-radio="20"> A) to advertise local accommodation</label>
                <label class="mcq-opt"><input type="radio" name="q20" value="B" data-lq-radio="20"> B) to explain campus facilities</label>
                <label class="mcq-opt"><input type="radio" name="q20" value="C" data-lq-radio="20"> C) to discuss exam preparation</label>
              </div>
            </div>
          </div>
        </div>

        <div class="listen-page hidden" id="listenSec3">
          <div class="listen-block">
            <div class="listen-h">SECTION 3 - Questions 21-30</div>
            <div class="listen-card">
              <div class="listen-card-title">Questions 21-25</div>
              <div class="listen-inst">Choose <b>FIVE</b> answers from the box and write the correct letter, <b>A-G</b>, next to Questions 21-25.</div>
              <div class="optionsGrid">
                <div class="optCell"><b>A</b> poor time management</div>
                <div class="optCell"><b>B</b> expensive equipment</div>
                <div class="optCell"><b>C</b> unclear research focus</div>
                <div class="optCell"><b>D</b> lack of field data</div>
                <div class="optCell"><b>E</b> weak conclusion</div>
                <div class="optCell"><b>F</b> too many case studies</div>
                <div class="optCell"><b>G</b> limited references</div>
              </div>
              <div class="note-row"><span class="qnum">21</span> Emma's first draft <input data-lq="21" class="l-input tiny"></div>
              <div class="note-row"><span class="qnum">22</span> David's methods section <input data-lq="22" class="l-input tiny"></div>
              <div class="note-row"><span class="qnum">23</span> the project introduction <input data-lq="23" class="l-input tiny"></div>
              <div class="note-row"><span class="qnum">24</span> final presentation slides <input data-lq="24" class="l-input tiny"></div>
              <div class="note-row"><span class="qnum">25</span> the recommendation section <input data-lq="25" class="l-input tiny"></div>
            </div>

            <div class="listen-card">
              <div class="listen-card-title">Questions 26-30</div>
              <div class="listen-inst">Choose the correct letter, <b>A, B or C</b>.</div>
              <div class="mcq">
                <div class="mcq-q"><span class="qnum">26</span> Their tutor thinks the project topic is</div>
                <label class="mcq-opt"><input type="radio" name="q26" value="A" data-lq-radio="26"> A) too broad</label>
                <label class="mcq-opt"><input type="radio" name="q26" value="B" data-lq-radio="26"> B) highly original</label>
                <label class="mcq-opt"><input type="radio" name="q26" value="C" data-lq-radio="26"> C) difficult to research</label>
              </div>
              <div class="mcq">
                <div class="mcq-q"><span class="qnum">27</span> Emma says the best source of evidence would be</div>
                <label class="mcq-opt"><input type="radio" name="q27" value="A" data-lq-radio="27"> A) teacher interviews</label>
                <label class="mcq-opt"><input type="radio" name="q27" value="B" data-lq-radio="27"> B) published surveys</label>
                <label class="mcq-opt"><input type="radio" name="q27" value="C" data-lq-radio="27"> C) historical newspapers</label>
              </div>
              <div class="mcq">
                <div class="mcq-q"><span class="qnum">28</span> David is worried that their argument is</div>
                <label class="mcq-opt"><input type="radio" name="q28" value="A" data-lq-radio="28"> A) too emotional</label>
                <label class="mcq-opt"><input type="radio" name="q28" value="B" data-lq-radio="28"> B) not balanced enough</label>
                <label class="mcq-opt"><input type="radio" name="q28" value="C" data-lq-radio="28"> C) missing local examples</label>
              </div>
              <div class="mcq">
                <div class="mcq-q"><span class="qnum">29</span> The tutor advises them to improve the report by</div>
                <label class="mcq-opt"><input type="radio" name="q29" value="A" data-lq-radio="29"> A) reducing statistics</label>
                <label class="mcq-opt"><input type="radio" name="q29" value="B" data-lq-radio="29"> B) using shorter quotations</label>
                <label class="mcq-opt"><input type="radio" name="q29" value="C" data-lq-radio="29"> C) linking claims to evidence</label>
              </div>
              <div class="mcq">
                <div class="mcq-q"><span class="qnum">30</span> They both agree to finish by</div>
                <label class="mcq-opt"><input type="radio" name="q30" value="A" data-lq-radio="30"> A) Friday afternoon</label>
                <label class="mcq-opt"><input type="radio" name="q30" value="B" data-lq-radio="30"> B) Saturday morning</label>
                <label class="mcq-opt"><input type="radio" name="q30" value="C" data-lq-radio="30"> C) Sunday evening</label>
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
              <div class="listen-card-title">Lecture on birds and migration</div>
              <div class="listen-notes">
                <div class="note-row">Some species travel because of seasonal changes in <span class="qnum">31</span> <input data-lq="31" class="l-input"></div>
                <div class="note-row">Migration routes are influenced by access to <span class="qnum">32</span> <input data-lq="32" class="l-input"></div>
                <div class="note-row">Many young birds learn routes from older <span class="qnum">33</span> <input data-lq="33" class="l-input"></div>
                <div class="note-row">One method of navigation involves the Earth's magnetic <span class="qnum">34</span> <input data-lq="34" class="l-input"></div>
                <div class="note-row">Scientists attach tiny <span class="qnum">35</span> <input data-lq="35" class="l-input"> to track long-distance movement</div>
                <div class="note-row">Bad weather can delay arrival and reduce breeding <span class="qnum">36</span> <input data-lq="36" class="l-input"></div>
                <div class="note-row">Loss of wetlands reduces safe places for birds to <span class="qnum">37</span> <input data-lq="37" class="l-input"></div>
                <div class="note-row">Artificial light can confuse birds flying above large <span class="qnum">38</span> <input data-lq="38" class="l-input"></div>
                <div class="note-row">Some species now migrate earlier because of climate <span class="qnum">39</span> <input data-lq="39" class="l-input"></div>
                <div class="note-row">Long-term monitoring helps conservation planners set national <span class="qnum">40</span> <input data-lq="40" class="l-input"></div>
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
          passageText: `The Effects of Traffic Noise

A Traffic noise has become one of the defining features of modern city life. Although people often accept it as a normal part of urban living, researchers have increasingly examined whether long-term exposure to road noise can affect both physical and mental wellbeing. Over the past few decades, a growing body of evidence has linked persistent environmental noise to disturbed sleep, reduced concentration and increased stress.

B Early studies tended to focus on immediate annoyance. People living close to busy roads regularly reported irritation, tiredness and difficulty relaxing at home. At first, some officials assumed that such complaints were mostly subjective and had little wider significance. Later research, however, suggested that noise was more than a quality-of-life issue and could have measurable biological consequences.

C One area of concern is sleep. Even when people do not wake fully, noise events during the night can alter sleep patterns and reduce the restorative value of rest. Repeated disturbance may contribute to daytime fatigue, poorer mood and lower performance at school or work. Because these effects accumulate gradually, they can be difficult for individuals to recognise in themselves.

D Researchers have also examined the effect of noise on children. In schools near airports or major roads, pupils have sometimes shown weaker reading comprehension and reduced memory performance compared with children studying in quieter environments. Not all studies have reached identical conclusions, but enough consistent patterns have emerged for the issue to attract international attention.

E Governments have responded in different ways. Some cities have introduced quieter road surfaces, stricter building insulation rules and traffic-management measures intended to reduce noise exposure. Urban planners increasingly consider sound when designing housing and transport systems, though financial and political pressures often limit how much can be done.

F Despite growing concern, some questions remain unresolved. It is not always easy to separate the effect of noise from related factors such as air pollution, housing quality or income levels. Nevertheless, many experts argue that the available evidence is now strong enough to justify preventive action, especially in densely populated areas.`,
          blocks: [
            {
              type: "tfng",
              title: "Questions 1-6",
              instructions: [
                "Do the following statements agree with the information given in Reading Passage 1?",
                "For each statement, choose TRUE, FALSE or NOT GIVEN.",
              ],
              items: [
                { q: 1, text: "Road noise is now regarded as a common feature of urban life." },
                { q: 2, text: "Officials immediately accepted that traffic noise could damage health." },
                { q: 3, text: "Night-time noise can affect people even if they do not wake completely." },
                { q: 4, text: "All studies of children have produced identical findings." },
                { q: 5, text: "Every city has introduced strict rules on road noise." },
                { q: 6, text: "Researchers find it easy to separate noise from air pollution in health studies." },
              ],
            },
            {
              type: "headings",
              title: "Questions 7-12",
              instructions: [
                "Reading Passage 1 has six paragraphs, A-F.",
                "Choose the correct heading for each paragraph from the list below.",
              ],
              listTitle: "List of Headings",
              headings: [
                { value: "i", label: "Difficulties in measuring a single cause" },
                { value: "ii", label: "Possible effects on learning" },
                { value: "iii", label: "Why sleep quality matters" },
                { value: "iv", label: "Initial underestimation of the problem" },
                { value: "v", label: "A widespread feature of city environments" },
                { value: "vi", label: "Different practical responses by authorities" },
                { value: "vii", label: "The historical growth of car ownership" },
                { value: "viii", label: "Evidence that noise never affects mood" },
              ],
              questions: [
                { q: 7, paragraph: "Paragraph A" },
                { q: 8, paragraph: "Paragraph B" },
                { q: 9, paragraph: "Paragraph C" },
                { q: 10, paragraph: "Paragraph D" },
                { q: 11, paragraph: "Paragraph E" },
                { q: 12, paragraph: "Paragraph F" },
              ],
            },
            {
              type: "sentenceGaps",
              title: "Questions 13-14",
              instructions: [
                "Complete the notes below.",
                "Choose NO MORE THAN TWO WORDS from the passage for each answer.",
              ],
              items: [
                { q: 13, text: "Repeated sleep disturbance may lead to daytime fatigue and poorer", tail: "" },
                { q: 14, text: "Some urban measures include road surfaces that are", tail: "" },
              ],
            },
          ],
        },
        {
          id: "part2",
          passageText: `Static Electricity in Everyday Life

A Static electricity is one of the most familiar but least understood physical effects in daily life. People notice it when clothes cling together, when a balloon sticks to a wall or when a small shock passes from a fingertip to a metal object. In each case, the cause lies in an imbalance of electric charge on the surface of materials.

B The effect is created when two materials come into contact and then separate. During this process, electrons may move from one surface to another. One object is left with an excess of electrons and becomes negatively charged, while the other loses electrons and becomes positively charged. Because opposite charges attract, the two surfaces may pull toward each other.

C Static electricity is easier to observe in dry conditions. Moist air allows charge to leak away more quickly, but dry air helps it remain on a surface for longer. That is why small shocks are often more noticeable in heated indoor spaces during winter.

D Although static electricity is sometimes a nuisance, it can also be useful. The principle is applied in photocopiers and laser printers, where electrically charged surfaces help place toner accurately on paper. It is also used in certain industrial filters to remove tiny particles from gases.

E In nature, static charge can accumulate on a far larger scale. Within clouds, collisions between ice particles and droplets help separate charge. When the electrical difference becomes strong enough, the surrounding air breaks down and lightning occurs. This dramatic event is one of the clearest examples of static electricity at work.

F Scientists continue to study static electricity because it influences both natural systems and technology. Even very small particles can behave differently when electrically charged, and this affects fields ranging from manufacturing to environmental science.`,
          blocks: [
            {
              type: "headings",
              title: "Questions 15-20",
              instructions: [
                "Reading Passage 2 has six paragraphs, A-F.",
                "Choose the correct heading for each paragraph from the list of headings below.",
              ],
              listTitle: "List of Headings",
              headings: [
                { value: "i", label: "Large-scale atmospheric consequences" },
                { value: "ii", label: "How materials exchange charge" },
                { value: "iii", label: "Why dry air makes the effect stronger" },
                { value: "iv", label: "Unexpected industrial uses" },
                { value: "v", label: "A familiar but often unexplained phenomenon" },
                { value: "vi", label: "Why scientists have lost interest" },
                { value: "vii", label: "Microscopic pores in solid materials" },
              ],
              questions: [
                { q: 15, paragraph: "Paragraph A" },
                { q: 16, paragraph: "Paragraph B" },
                { q: 17, paragraph: "Paragraph C" },
                { q: 18, paragraph: "Paragraph D" },
                { q: 19, paragraph: "Paragraph E" },
                { q: 20, paragraph: "Paragraph F" },
              ],
            },
            {
              type: "sentenceGaps",
              title: "Questions 21-26",
              instructions: [
                "Complete the summary below.",
                "Choose ONE WORD ONLY from the passage for each answer.",
              ],
              items: [
                { q: 21, text: "Static electricity results from an imbalance of electric", tail: "" },
                { q: 22, text: "One material may gain extra", tail: " during contact" },
                { q: 23, text: "In humid conditions, charge can leak away through the", tail: "" },
                { q: 24, text: "Photocopiers and printers use static electricity to position", tail: "" },
                { q: 25, text: "In clouds, collisions between particles can eventually lead to", tail: "" },
                { q: 26, text: "Charged particles are important in both technology and", tail: " science" },
              ],
            },
          ],
        },
        {
          id: "part3",
          passageText: `How We Learn From Experience

A People often assume that experience naturally produces learning. Yet psychologists point out that experience alone may not be enough. The human mind filters events, remembers some elements more clearly than others and sometimes draws inaccurate conclusions. Effective learning usually depends on reflection as much as exposure.

B One reason experience can be misleading is that it is selective. People tend to notice evidence that supports what they already believe while overlooking details that challenge those beliefs. This habit can make mistaken ideas feel convincing, especially when the same kinds of situations are repeated.

C Feedback is therefore crucial. When learners receive prompt, specific feedback, they are more likely to recognise the gap between what they intended to do and what actually happened. In education, sport and professional training, feedback often turns routine practice into meaningful improvement.

D Another factor is memory. Not all experiences are stored equally, and recall is often shaped by emotion, repetition and context. A dramatic event may remain vivid for years, while a useful but ordinary lesson can disappear quickly unless it is revisited.

E Experts often differ from novices not because they have had more experiences in a simple sense, but because they have organised those experiences better. They form patterns, recognise exceptions and know which details matter. This structured understanding allows them to make faster and more reliable decisions.

F However, there are limits to what personal experience can teach. In complex fields such as medicine, aviation or public policy, individual experience may be too narrow to reveal broader patterns. That is why evidence from research, data and collaboration remains essential.

G Modern education increasingly tries to combine experience with guided reflection. Students may complete projects, simulations or placements, but they are also encouraged to analyse their choices, compare outcomes and identify principles they can transfer to new situations.

H The strongest learning often happens when experience, feedback and reflection work together. Experience provides raw material, feedback highlights strengths and weaknesses, and reflection helps turn events into more general understanding.`,
          blocks: [
            {
              type: "headings",
              title: "Questions 27-32",
              instructions: [
                "Reading Passage 3 has eight paragraphs, A-H.",
                "Choose the correct heading for each paragraph from the list of headings below.",
              ],
              listTitle: "List of Headings",
              headings: [
                { value: "i", label: "Why research is still necessary" },
                { value: "ii", label: "The role of memory in preserving lessons" },
                { value: "iii", label: "Experience does not automatically lead to understanding" },
                { value: "iv", label: "How experts organise what they know" },
                { value: "v", label: "The danger of noticing only confirming evidence" },
                { value: "vi", label: "Why dramatic events should be avoided" },
                { value: "vii", label: "A combined model of effective learning" },
                { value: "viii", label: "Making practice more meaningful through feedback" },
                { value: "ix", label: "How classrooms now structure reflective activity" },
              ],
              questions: [
                { q: 27, paragraph: "Paragraph A" },
                { q: 28, paragraph: "Paragraph B" },
                { q: 29, paragraph: "Paragraph C" },
                { q: 30, paragraph: "Paragraph D" },
                { q: 31, paragraph: "Paragraph E" },
                { q: 32, paragraph: "Paragraph F" },
              ],
            },
            {
              type: "mcq",
              title: "Questions 33-37",
              instructions: ["Choose the correct letter, A, B, C or D."],
              items: [
                {
                  q: 33,
                  text: "According to the passage, experience alone may fail because people",
                  choices: {
                    A: "forget everything immediately",
                    B: "interpret events selectively",
                    C: "avoid emotional situations",
                    D: "prefer classroom teaching only",
                  },
                },
                {
                  q: 34,
                  text: "Paragraph C suggests feedback is most useful when it is",
                  choices: {
                    A: "immediate and detailed",
                    B: "public and competitive",
                    C: "delayed but encouraging",
                    D: "short and general",
                  },
                },
                {
                  q: 35,
                  text: "Experts are described as people who",
                  choices: {
                    A: "always remember every experience",
                    B: "avoid making quick decisions",
                    C: "recognise patterns and exceptions",
                    D: "rely only on intuition",
                  },
                },
                {
                  q: 36,
                  text: "In complex fields, personal experience is limited because it may be",
                  choices: {
                    A: "too emotionally difficult",
                    B: "too narrow",
                    C: "too theoretical",
                    D: "too repetitive",
                  },
                },
                {
                  q: 37,
                  text: "Modern education tries to combine experience with",
                  choices: {
                    A: "strict memorisation",
                    B: "guided reflection",
                    C: "less collaboration",
                    D: "more punishment",
                  },
                },
              ],
            },
            {
              type: "sentenceGaps",
              title: "Questions 38-40",
              instructions: [
                "Complete the summary below.",
                "Choose ONE WORD ONLY from the passage for each answer.",
              ],
              items: [
                { q: 38, text: "Experience gives learners the raw", tail: " for later understanding" },
                { q: 39, text: "Feedback helps identify both strengths and", tail: "" },
                { q: 40, text: "Reflection allows learners to transfer ideas to new", tail: "" },
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
