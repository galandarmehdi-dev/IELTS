/* assets/js/tests/test2Content.js */
(function () {
  "use strict";

  window.IELTS = window.IELTS || {};
  window.IELTS.Registry = window.IELTS.Registry || {};
  const R = window.IELTS.Registry;

  const test2 = {
    listening: {
  audioSrc: "https://audio.ieltsmock.org/listening_tp_part2.mp3",
  html: `
    <div class="listen-page" id="listenSec1">
      <div class="listen-block">
        <div class="listen-h">SECTION 1 — Questions 1–10</div>

        <div class="listen-card">
          <div class="listen-card-title">Questions 1–6</div>
          <div class="listen-inst">Complete the form below. Write <b>NO MORE THAN TWO WORDS AND/OR A NUMBER</b> for each answer.</div>
          <div class="listen-card-title">Application Form for use of Library Internet Service</div>
          <div class="listen-example">
            <div><b>Example</b></div>
            <div>Existing cardholder? <b>Yes</b></div>
          </div>
          <div class="listen-notes">
            <div class="note-row">Family name: Milton</div>
            <div class="note-row"><span class="qnum">1</span> First names: <input data-lq="1" class="l-input"> Jayne</div>
            <div class="note-row"><span class="qnum">2</span> Address: <input data-lq="2" class="l-input"></div>
            <div class="note-row">35 Maximilian Way</div>
            <div class="note-row">Whitfield</div>
            <div class="note-row"><span class="qnum">3</span> Post Code: <input data-lq="3" class="l-input small"></div>
            <div class="note-row">Occupation: Nurse</div>
            <div class="note-row">(works the <span class="qnum">4</span> <input data-lq="4" class="l-input small">)</div>
            <div class="note-row">Home phone: N/A</div>
            <div class="note-row">Mobile: 0412 214 418</div>
            <div class="note-row"><span class="qnum">5</span> Type of ID: <input data-lq="5" class="l-input"></div>
            <div class="note-row">ID number: AZ 1985331</div>
            <div class="note-row">Date of Birth: 25th <span class="qnum">6</span> <input data-lq="6" class="l-input small"></div>
          </div>
        </div>

        <div class="listen-card">
          <div class="listen-card-title">Questions 7 and 8</div>
          <div class="listen-inst">What will the woman use the internet for? Choose <b>TWO</b> letters, A–E. Type one letter in each box.</div>
          <div class="endings-box">
            <div><b>A</b> trade &amp; exchange</div>
            <div><b>B</b> research</div>
            <div><b>C</b> email</div>
            <div><b>D</b> social networking</div>
            <div><b>E</b> job vacancies</div>
          </div>
          <div class="note-row"><span class="qnum">7</span> First choice: <input data-lq="7" class="l-input tiny"></div>
          <div class="note-row"><span class="qnum">8</span> Second choice: <input data-lq="8" class="l-input tiny"></div>
        </div>

        <div class="listen-card">
          <div class="listen-card-title">Questions 9 and 10</div>
          <div class="listen-inst">Write <b>NO MORE THAN TWO WORDS AND/OR A NUMBER</b> for each answer.</div>
          <div class="note-row"><span class="qnum">9</span> How much does it cost to register as an internet user? <input data-lq="9" class="l-input"></div>
          <div class="note-row"><span class="qnum">10</span> What is the maximum amount of time allowed per single daily internet session? <input data-lq="10" class="l-input"></div>
        </div>
      </div>
    </div>

    <div class="listen-page hidden" id="listenSec2">
      <div class="listen-block">
        <div class="listen-h">SECTION 2 — Questions 11–20</div>

        <div class="listen-card">
          <div class="listen-card-title">Questions 11–15</div>
          <div class="listen-inst">Choose the correct letter, <b>A, B or C</b>.</div>
          <div class="mcq">
            <div class="mcq-q"><span class="qnum">11</span> The guided bushwalk is suitable for</div>
            <label class="mcq-opt"><input type="radio" name="q11" value="A" data-lq-radio="11"> A) adults only</label>
            <label class="mcq-opt"><input type="radio" name="q11" value="B" data-lq-radio="11"> B) children over 12 and adults</label>
            <label class="mcq-opt"><input type="radio" name="q11" value="C" data-lq-radio="11"> C) children over 8 accompanied by a parent</label>
          </div>
          <div class="mcq">
            <div class="mcq-q"><span class="qnum">12</span> On the bird observation outing, it is recommended that you have</div>
            <label class="mcq-opt"><input type="radio" name="q12" value="A" data-lq-radio="12"> A) waterproof footwear</label>
            <label class="mcq-opt"><input type="radio" name="q12" value="B" data-lq-radio="12"> B) a bird identification book</label>
            <label class="mcq-opt"><input type="radio" name="q12" value="C" data-lq-radio="12"> C) binoculars</label>
          </div>
          <div class="mcq">
            <div class="mcq-q"><span class="qnum">13</span> For the trip to the sand dunes, a company will donate</div>
            <label class="mcq-opt"><input type="radio" name="q13" value="A" data-lq-radio="13"> A) water</label>
            <label class="mcq-opt"><input type="radio" name="q13" value="B" data-lq-radio="13"> B) tools</label>
            <label class="mcq-opt"><input type="radio" name="q13" value="C" data-lq-radio="13"> C) gloves</label>
          </div>
          <div class="mcq">
            <div class="mcq-q"><span class="qnum">14</span> The bush tucker excursion will cost (per person)</div>
            <label class="mcq-opt"><input type="radio" name="q14" value="A" data-lq-radio="14"> A) $15</label>
            <label class="mcq-opt"><input type="radio" name="q14" value="B" data-lq-radio="14"> B) $12</label>
            <label class="mcq-opt"><input type="radio" name="q14" value="C" data-lq-radio="14"> C) $7</label>
          </div>
          <div class="mcq">
            <div class="mcq-q"><span class="qnum">15</span> The deadline to register for the bush tucker outing is</div>
            <label class="mcq-opt"><input type="radio" name="q15" value="A" data-lq-radio="15"> A) 25 November</label>
            <label class="mcq-opt"><input type="radio" name="q15" value="B" data-lq-radio="15"> B) 15 November</label>
            <label class="mcq-opt"><input type="radio" name="q15" value="C" data-lq-radio="15"> C) 10 November</label>
          </div>
        </div>

        <div class="listen-card">
          <div class="listen-card-title">Questions 16–20</div>
          <div class="listen-inst">Complete the table below. Write <b>NO MORE THAN TWO WORDS AND/OR A NUMBER</b> for each answer.</div>
          <div class="listen-table-wrap">
            <table class="listen-table">
              <thead><tr><th>Activity</th><th>Leader</th><th>Date</th><th>Venue</th><th>Time</th></tr></thead>
              <tbody>
                <tr><td>Bush walk</td><td>Glenn Ford</td><td><span class="qnum">16</span> <input data-lq="16" class="l-input tiny"></td><td>Springvale</td><td><span class="qnum">17</span> <input data-lq="17" class="l-input tiny">–1pm</td></tr>
                <tr><td>Bird watching</td><td>Joy Black, club <span class="qnum">18</span> <input data-lq="18" class="l-input tiny"></td><td>10 September</td><td>Camford</td><td>4.30–6.30pm</td></tr>
                <tr><td>Sand dunes</td><td>Rex Rose</td><td>26 November</td><td><span class="qnum">19</span> <input data-lq="19" class="l-input tiny"></td><td>8.30–10.30am</td></tr>
                <tr><td>Bush tucker</td><td>Jim Kerr, ranger</td><td>3 December</td><td>Carson Hills</td><td>10am–<span class="qnum">20</span> <input data-lq="20" class="l-input tiny"></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div class="listen-page hidden" id="listenSec3">
      <div class="listen-block">
        <div class="listen-h">SECTION 3 — Questions 21–30</div>
        <div class="listen-card">
          <div class="listen-card-title">Questions 21–25</div>
          <div class="listen-inst">Complete the sentences below. Write <b>NO MORE THAN TWO WORDS</b> for each answer.</div>
          <div class="note-row"><span class="qnum">21</span> Students must follow <input data-lq="21" class="l-input"> to prevent accidents in the lab.</div>
          <div class="note-row"><span class="qnum">22</span> The students have not been using <input data-lq="22" class="l-input"> while in the lab.</div>
          <div class="note-row"><span class="qnum">23</span> Students cannot eat or drink until <input data-lq="23" class="l-input"> is finished and they have washed their hands.</div>
          <div class="note-row"><span class="qnum">24</span> Tessa should tie her hair back to avoid danger when she is working with a <input data-lq="24" class="l-input"> or chemicals.</div>
          <div class="note-row"><span class="qnum">25</span> Students must wear long sleeves and shoes made of <input data-lq="25" class="l-input"> in the lab.</div>
        </div>

        <div class="listen-card">
          <div class="listen-card-title">Questions 26–28</div>
          <div class="listen-inst">Choose the correct letter, <b>A, B or C</b>.</div>
          <div class="mcq">
            <div class="mcq-q"><span class="qnum">26</span> Which student is currently using an appropriate notebook?</div>
            <label class="mcq-opt"><input type="radio" name="q26" value="A" data-lq-radio="26"> A) Vincent</label>
            <label class="mcq-opt"><input type="radio" name="q26" value="B" data-lq-radio="26"> B) Tessa</label>
            <label class="mcq-opt"><input type="radio" name="q26" value="C" data-lq-radio="26"> C) Neither student</label>
          </div>
          <div class="mcq">
            <div class="mcq-q"><span class="qnum">27</span> The tutor says that writing observations in complete sentences</div>
            <label class="mcq-opt"><input type="radio" name="q27" value="A" data-lq-radio="27"> A) is often not a good use of time</label>
            <label class="mcq-opt"><input type="radio" name="q27" value="B" data-lq-radio="27"> B) makes them easier to interpret later</label>
            <label class="mcq-opt"><input type="radio" name="q27" value="C" data-lq-radio="27"> C) means that others can understand them</label>
          </div>
          <div class="mcq">
            <div class="mcq-q"><span class="qnum">28</span> The students must write dates</div>
            <label class="mcq-opt"><input type="radio" name="q28" value="A" data-lq-radio="28"> A) next to each drawing</label>
            <label class="mcq-opt"><input type="radio" name="q28" value="B" data-lq-radio="28"> B) next to each written section</label>
            <label class="mcq-opt"><input type="radio" name="q28" value="C" data-lq-radio="28"> C) next to each drawing and written section</label>
          </div>
        </div>

        <div class="listen-card">
          <div class="listen-card-title">Questions 29 and 30</div>
          <div class="listen-inst">Which <b>TWO</b> things must be included in the conclusion to the experiment? Type one letter in each box.</div>
          <div class="endings-box">
            <div><b>A</b> the questions investigated</div>
            <div><b>B</b> the solutions to the questions</div>
            <div><b>C</b> the student’s own thoughts about the experiment</div>
            <div><b>D</b> the length of time spent on the experiment</div>
            <div><b>E</b> the student’s signature</div>
          </div>
          <div class="note-row"><span class="qnum">29</span> First choice: <input data-lq="29" class="l-input tiny"></div>
          <div class="note-row"><span class="qnum">30</span> Second choice: <input data-lq="30" class="l-input tiny"></div>
        </div>
      </div>
    </div>

    <div class="listen-page hidden" id="listenSec4">
      <div class="listen-block">
        <div class="listen-h">SECTION 4 — Questions 31–40</div>

        <div class="listen-card">
          <div class="listen-card-title">Questions 31–40</div>
          <div class="listen-inst">Complete the notes below. Write <b>NO MORE THAN TWO WORDS AND/OR A NUMBER</b> for each answer.</div>
          <div class="listen-card-title">Climate change</div>

          <div class="note-row"><b>HUMAN FACTORS</b></div>
          <div class="note-row bullet">• Cutting down trees for <span class="qnum">31</span> <input data-lq="31" class="l-input" autocomplete="off" spellcheck="false"></div>
          <div class="note-row bullet">• Industrial Revolution</div>
          <div class="note-row bullet">• <span class="qnum">32</span> <input data-lq="32" class="l-input" autocomplete="off" spellcheck="false"></div>
          <div class="note-row bullet">• Increase in population → deforestation</div>

          <div class="note-row"><b>KNOWN EFFECTS</b></div>
          <div class="note-row bullet">• Over previous 130 yrs: temp. ↑ by 0.6 °C</div>
          <div class="note-row bullet">• Since Ind. Rev.: CO2 ↑ by 30% &amp; Methane ↑ by <span class="qnum">33</span> <input data-lq="33" class="l-input tiny" autocomplete="off" spellcheck="false"> (from mining, animals, rice paddies)</div>
          <div class="note-row bullet">• N2O ↑ (from <span class="qnum">34</span> <input data-lq="34" class="l-input" autocomplete="off" spellcheck="false"> esp. fertiliser; waste management; car exhausts)</div>
          <div class="note-row bullet">• Greenhouse Effect: gases form <span class="qnum">35</span> <input data-lq="35" class="l-input" autocomplete="off" spellcheck="false"> → heat trapped → Earth warms up</div>

          <div class="note-row"><b>FUTURE EFFECTS</b></div>

          <div class="listen-table-wrap">
            <table class="listen-table">
              <thead>
                <tr>
                  <th>Sea level</th>
                  <th>Number of people at risk</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1998 levels</td>
                  <td><span class="qnum">36</span> <input data-lq="36" class="l-input tiny" autocomplete="off" spellcheck="false"></td>
                </tr>
                <tr>
                  <td>+50 cm</td>
                  <td>92 million</td>
                </tr>
                <tr>
                  <td>+1 metre</td>
                  <td><span class="qnum">37</span> <input data-lq="37" class="l-input tiny" autocomplete="off" spellcheck="false"></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="note-row bullet">2. Change in <span class="qnum">38</span> <input data-lq="38" class="l-input" autocomplete="off" spellcheck="false"> → more arid areas → population movement to cities</div>
          <div class="note-row bullet">3. Increase in pests and <span class="qnum">39</span> <input data-lq="39" class="l-input" autocomplete="off" spellcheck="false"> e.g. malaria</div>
          <div class="note-row bullet">4. Change in ecosystems: shift in <span class="qnum">40</span> <input data-lq="40" class="l-input" autocomplete="off" spellcheck="false"> – some die, others multiply</div>
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
      task1Html: `You should spend about 20 minutes on this task.<br>
The graph below shows the proportion of four different materials that were recycled from 1982 to 2010 in a particular country.<br>
Summarise the information by selecting and reporting the main features, and make comparisons where relevant.<br>
<b>Write at least 150 words.</b>`,
      task1ImageSrc: "https://www.ieltsbuddy.com/images/ielts-line-graph-recycling-different-materials-21962309.jpg",
      task2Html: `You should spend about 40 minutes on this task.<br><br>
Some parents and teachers think that children's behavior should be strictly controlled. While some think that children should be free to behave.<br>
<b>Discuss both views and give your opinion.</b><br>
Write at least 250 words.`
    },
    reading: {
      parts: [
        {
          id: "part1",
          passageText: `The MAGIC of KEFIR

A The shepherds of the North Caucasus region of Europe were only trying to transport milk the best way they knew how – in leather pouches strapped to the side of donkeys – when they made a significant discovery. A fermentation process would sometimes inadvertently occur en route, and when the pouches were opened up on arrival they would no longer contain milk but rather a pungent, effervescent, low-alcoholic substance instead. This unexpected development was a blessing in disguise. The new drink – which acquired the name kefir – turned out to be a health tonic, a naturally-preserved dairy product and a tasty addition to our culinary repertoire.

B Although their exact origin remains a mystery, we do know that yeast-based kefir grains have always been at the root of the kefir phenomenon. These grains are capable of a remarkable feat: in contradistinction to most other items you might find in a grocery store, they actually expand and propagate with use. This is because the grains, which are granular to the touch and bear a slight resemblance to cauliflower rosettes, house active cultures that feed on lactose when added to milk. Consequently, a bigger problem for most kefir drinkers is not where to source new kefir grains, but what to do with the ones they already have!

C The great thing about kefir is that it does not require a manufacturing line in order to be produced. Grains can be simply thrown in with a batch of milk for ripening to begin. The mixture then requires a cool, dark place to live and grow, with periodic unsettling to prevent clumping (Caucasus inhabitants began storing the concoction in animal-skin satchels on the back of doors – every time someone entered the room the mixture would get lightly shaken). After about 24 hours the yeast cultures in the grains have multiplied and devoured most of the milk sugars, and the final product is then ready for human consumption.

D Nothing compares to a person’s first encounter with kefir. The smooth, uniform consistency rolls over the tongue in a manner akin to liquefied yogurt. The sharp, tart pungency of unsweetened yogurt is there too, but there is also a slight hint of effervescence, something most users will have previously associated only with mineral waters, soda or beer. Kefir also comes with a subtle aroma of yeast, and depending on the type of milk and ripening conditions, ethanol content can reach up to two or three percent – about on par with a decent lager – although you can expect around 0.8 to one per cent for a typical day-old preparation. This can bring out a tiny edge of alcohol in the kefir’s flavour.

E Although it has prevailed largely as a fermented milk drink, over the years kefir has acquired a number of other uses. Many bakers use it instead of starter yeast in the preparation of sourdough, and the tangy flavour also makes kefir an ideal buttermilk substitute in pancakes. Kefir also accompanies sour cream as one of the main ingredients in cold beetroot soup and can be used in lieu of regular cow’s milk on granola or cereal. As a way to keep their digestive systems fine-tuned, athletes sometimes combine kefir with yoghurt in protein shakes.

F Associated for centuries with pictures of Slavic babushkas clutching a shawl in one hand and a cup of kefir in the other, the unassuming beverage has become a minor celebrity of the nascent health food movement in the contemporary West. Every day, more studies pour out supporting the benefits of a diet high in probiotics. This trend toward consuming probiotics has engulfed the leisure classes in these countries to the point that it is poised to become, according to some commentators, “the next multivitamin”. These days the word kefir is consequently more likely to bring to mind glamorous, yoga mat-toting women from Los Angeles than austere visions of blustery Eastern Europe.

G Kefir’s rise in popularity has encouraged producers to take short cuts or alter the production process. Some home users have omitted the ripening and culturation process while commercial dealers often add thickeners, stabilisers and sweeteners. But the beauty of kefir is that, at its healthiest and tastiest, it is a remarkably affordable, uncluttered process, as any accidental invention is bound to be. All that is necessary are some grains, milk and a little bit of patience. A return to the unadulterated kefir-making of old is in everyone’s interest.`,
          blocks: [
            { type: "headings", title: "Questions 1–7", instructions: ["Reading Passage 1 has seven paragraphs, A–G.", "Choose the correct heading for each paragraph from the list of headings below.", "Write the correct number, i–x, in the gaps."], listTitle: "List of Headings", headings: [
              {value:"i",label:"A unique sensory experience"},{value:"ii",label:"Getting back to basics"},{value:"iii",label:"The gift that keeps on giving"},{value:"iv",label:"Variations in alcohol content"},{value:"v",label:"Old methods of transportation"},{value:"vi",label:"Culinary applications"},{value:"vii",label:"Making kefir"},{value:"viii",label:"A fortunate accident"},{value:"ix",label:"Kefir gets an image makeover"},{value:"x",label:"Ways to improve taste"}
            ], questions:[{q:1,paragraph:"Section A"},{q:2,paragraph:"Section B"},{q:3,paragraph:"Section C"},{q:4,paragraph:"Section D"},{q:5,paragraph:"Section E"},{q:6,paragraph:"Section F"},{q:7,paragraph:"Section G"}] },
            { type: "shortAnswer", title: "Questions 8–11", instructions: ["Answer the questions below using NO MORE THAN TWO WORDS from the passage for each answer.", "Write your answers in the gaps."], questions:[{q:8,text:"What do kefir grains look like?"},{q:9,text:"What needs to happen to kefir while it is ripening?"},{q:10,text:"What will the yeast cultures have consumed before kefir is ready to drink?"},{q:11,text:"The texture of kefir in the mouth is similar to what?"}]},
            { type: "multiTextChoices", title: "Questions 12 and 13", instructions:["Which TWO products are NOT mentioned as things which kefir can replace?", "Choose TWO letters, A–E. Type one letter in each box."], choices:[{letter:"A",text:"Ordinary cow’s milk"},{letter:"B",text:"Buttermilk"},{letter:"C",text:"Sour cream"},{letter:"D",text:"Starter yeast"},{letter:"E",text:"Yoghurt"}], items:[{q:12,text:"First answer"},{q:13,text:"Second answer"}] }
          ]
        },
        {
          id: "part2",
          passageText: `FOOD FOR THOUGHT

A Why not eat insects? So asked British entomologist Vincent M. Holt in the title of his 1885 treatise on the benefits of what he named entomophagy – the consumption of insects (and similar creatures) as a food source. The prospect of eating dishes such as “wireworm sauce” and “slug soup” failed to garner favour amongst those in the stuffy, proper, Victorian social milieu of his time, however, and Holt’s visionary ideas were considered at best eccentric, at worst an offense to every refined palate. Anticipating such a reaction, Holt acknowledged the difficulty in unseating deep-rooted prejudices against insect cuisine, but quietly asserted his confidence that “we shall some day quite gladly cook and eat them”.

B It has taken nearly 150 years but an eclectic Western-driven movement has finally mounted around the entomophagic cause. In Los Angeles and other cosmopolitan Western cities, insects have been caught up in the endless pursuit of novel and authentic delicacies. “Eating grasshoppers is a thing you do here”, bug-supplier Bricia Lopez has explained. “There’s more of a ‘cool’ factor involved.” Meanwhile, the Food and Agricultural Organization has considered a policy paper on the subject, initiated farming projects in Laos, and set down plans for a world congress on insect farming in 2013.

C Eating insects is not a new phenomenon. In fact, insects and other such creatures are already eaten in 80 per cent of the world’s countries, prepared in customary dishes ranging from deep-fried tarantula in Cambodia to bowls of baby bees in China. With the specialist knowledge that Western companies and organisations can bring to the table, however, these hand-prepared delicacies have the potential to be produced on a scale large enough to lower costs and open up mass markets. A new American company, for example, is attempting to develop pressurisation machines that would de-shell insects and make them available in the form of cutlets. According to the entrepreneur behind the company, Matthew Krisiloff, this will be the key to pleasing the uninitiated palate.

D Insects certainly possess some key advantages over traditional Western meat sources. According to research findings from Professor Arnold van Huis, a Dutch entomologist, breeding insects results in far fewer noxious by-products. Insects produce less ammonia than pig and poultry farming, ten times less methane than livestock, and 300 times less nitrous oxide. Huis also notes that insects – being cold-blooded creatures – can convert food to protein at a rate far superior to that of cows, since the latter exhaust much of their energy just keeping themselves warm.

E Although insects are sometimes perceived by Westerners as unhygienic or disease-ridden, they are a reliable option in light of recent global epidemics. Because bugs are genetically distant from humans, species-hopping diseases such as swine flu or mad cow disease are much less likely to start or spread amongst grasshoppers or slugs than in poultry and cattle. Furthermore, the squalid, cramped quarters that encourage diseases to propagate among many animal populations are actually the residence of choice for insects, which thrive in such conditions.

F Then, of course, there are the commercial gains. As FAO Forestry Manager Patrick Durst notes, in developing countries many rural people and traditional forest dwellers have remarkable knowledge about managing insect populations to produce food. Until now, they have only used this knowledge to meet their own subsistence needs, but Durst believes that, with the adoption of modern technology and improved promotional methods, opportunities to expand the market to new consumers will flourish. This could provide a crucial step into the global economic arena for those primarily rural, impoverished populations who have been excluded from the rise of manufacturing and large-scale agriculture.

G Nevertheless, much stands in the way of the entomophagic movement. One problem is the damage that has been caused, and continues to be caused, by Western organisations prepared to kill off grasshoppers and locusts – complete food proteins – in favour of preserving the incomplete protein crops of millet, wheat, barley and maize. Entomologist Florence Dunkel has described the consequences of such interventions. While examining children’s diets as a part of her field work in Mali, Dunkel discovered that a protein deficiency syndrome called kwashiorkor was increasing in incidence. Children in the area were once protected against kwashiorkor by a diet high in grasshoppers, but these had become unsafe to eat after pesticide use in the area increased.

H A further issue is the persistent fear many Westerners still have about eating insects. “The problem is the ick factor—the eyes, the wings, the legs,” Krisiloff has said. “It’s not as simple as hiding it in a bug nugget. People won’t accept it beyond the novelty. When you think of a chicken, you think of a chicken breast, not the eyes, wings, and beak.” For Marcel Dicke, the key lies in camouflaging the fact that people are eating insects at all. Insect flour is one of his propositions, as is changing the language of insect cuisine. “If you say it’s mealworms, it makes people think of ringworm”, he notes. “So stop saying ‘worm’. If we use Latin names, say it’s a Tenebrio quiche, it sounds much more fancy”. For Krisiloff, Dicke and others, keeping quiet about the gritty reality of our food is often the best approach.

I It is yet to be seen if history will truly redeem Vincent Holt and his suggestion that British families should gather around their dining tables for a breakfast of “moths on toast”. It is clear, however, that entomophagy, far from being a kooky sideshow to the real business of food production, has much to offer in meeting the challenges that global societies in the 21st century will face.`,
          blocks:[
            { type:"headings", title:"Questions 14–21", instructions:["Reading Passage 2 has nine paragraphs, A–I.","Choose the correct heading for paragraphs A–H from the list of headings below.","Write the correct number, i–xi, in the gaps."], listTitle:"List of Headings", headings:[{value:"i",label:"A historical delicacy"},{value:"ii",label:"The poor may benefit"},{value:"iii",label:"Presentation is key to changing attitudes"},{value:"iv",label:"Environmentally friendly production"},{value:"v",label:"Tradition meets technology"},{value:"vi",label:"A cultural pioneer"},{value:"vii",label:"Western practices harm locals"},{value:"viii",label:"Good source of nutrients"},{value:"ix",label:"Growing popularity"},{value:"x",label:"A healthy choice"},{value:"xi",label:"A safety risk"}], questions:[{q:14,paragraph:"Section A"},{q:15,paragraph:"Section B"},{q:16,paragraph:"Section C"},{q:17,paragraph:"Section D"},{q:18,paragraph:"Section E"},{q:19,paragraph:"Section F"},{q:20,paragraph:"Section G"},{q:21,paragraph:"Section H"}] },
            { type:"sentenceGaps", title:"Questions 22–26", instructions:["Complete the notes below.","Choose NO MORE THAN THREE WORDS from the passage for each answer."], items:[{q:22,text:"Insects use food intake economically in the production of protein as they waste less",tail:"."},{q:23,text:"Traditional knowledge could be combined with modern methods for mass production instead of just covering",tail:"."},{q:24,text:"This could help",tail:" people gain access to world markets."},{q:25,text:"Due to increased",tail:", more children in Mali are suffering from"},{q:26,leadingBlank:true,text2:"."}] }
          ]
        },
        {
          id:"part3",
          passageText:`Love stories

“Love stories” are often associated – at least in the popular imagination – with fairy tales, adolescent day dreams, Disney movies and other frivolous pastimes. For psychologists developing taxonomies of affection and attachment, however, this is an area of rigorous academic pursuit. Beginning in the early 1970s with the groundbreaking contributions of John Alan Lee, researchers have developed classifications that they believe better characterise our romantic predispositions. This involves examining not a single, universal, emotional expression (“love”), but rather a series of divergent behaviours and narratives that each has an individualised purpose, desired outcome and state of mind. Lee’s gritty methodology painstakingly involved participants matching 170 typical romantic encounters with nearly 1500 possible reactions. The patterns unknowingly expressed by respondents culminated in a taxonomy of six distinct love “styles” that continue to inform research in the area forty years later.

The first of these styles – eros – is closely tied in with images of romantic love that are promulgated in Western popular culture. Characteristic of this style is a passionate emotional intensity, a strong physical magnetism – as if the two partners were literally being “pulled” together – and a sense of inevitability about the relationship. A related but more frantic style of love called mania involves an obsessive, compulsive attitude toward one’s partner. Vast swings in mood from ecstasy to agony – dependent on the level of attention a person is receiving from his or her partner – are typical of manic love.

Two styles were much more subdued, however. Storge is a quiet, companionate type of loving – “love by evolution” rather than “love by revolution”, according to some theorists. Relationships built on a foundation of platonic affection and caring are archetypal of storge. When care is extended to a sacrificial level of doting, however, it becomes another style – agape. In an agape relationship one partner becomes a “caretaker”, exalting the welfare of the other above his or her own needs.

The final two styles of love seem to lack aspects of emotion and reciprocity altogether. The ludus style envisions relationships primarily as a game in which it is best to “play the field” or experience a diverse set of partners over time. Mutually-gratifying outcomes in relationships are not considered necessary, and deception of a partner and lack of disclosure about one’s activities are also typical. While Lee found that college students in his study overwhelmingly disagreed with the tenets of this style, substantial numbers of them acted in a typically ludic style while dating, a finding that proves correct the deceit inherent in ludus. Pragma lovers also downplayed emotive aspects of relationships but favoured practical, sensible connections. Successful arranged marriages are a great example of pragma, in that the couple decide to make the relationship work; but anyone who seeks an ideal partner with a shopping list of necessary attributes fits the classification.

Robert J. Sternberg’s contemporary research on love stories has elaborated on how these narratives determine the shape of our relationships and our lives. Sternberg and others have proposed and tested the theory of love as a story, whereby the interaction of our personal attributes with the environment leads to the development of stories about love that we then seek to fulfil, to the extent possible, in our lives. Sternberg’s taxonomy of love stories numbers far more, at twenty-six, than Lee’s taxonomy of love styles, but as Sternberg himself admits there is plenty of overlap. The seventh story, Game, coincides with ludus, for example, while the nineteenth story, Sacrifice, fits neatly on top of agape.

Sternberg’s research demonstrates that we may have predilections toward multiple love stories, each represented in a mental hierarchy and varying in weight in terms of their personal significance. This explains the frustration many of us experience when comparing potential partners. One person often fulfils some expected narratives – such as a need for mystery and fantasy – while lacking the ability to meet the demands of others. It is also the case that stories have varying abilities to adapt to a given cultural milieu and its respective demands. Love stories are, therefore, interactive and adaptive phenomena in our lives rather than rigid prescriptions.

Sternberg also explores how our love stories interact with the love stories of our partners. What happens when someone who sees love as art collides with someone who sees love as business? Can a Sewing story coexist with a Theatre story? Certainly, it is clear that we look for partners with love stories that complement and are compatible with our own narratives. But they do not have to be an identical match. Not all love stories, however, are equally well predisposed to relationship longevity; stories that view love as a game, as a kind of surveillance or as an addiction are all unlikely to prove durable.

Research on love stories continues apace. Defying the myth that rigorous science and the romantic persuasions of ordinary people are incompatible, this research demonstrates that good psychology can clarify and comment on the way we give affection and form attachments.`,
          blocks:[
            { type:"endingsMatch", title:"Questions 27–34", instructions:["Match each statement with the correct term, A–F.","Write the correct letter, A–F, in the gaps.","You may use any letter more than once."], endings:{A:"Eros",B:"Mania",C:"Storge",D:"Agape",E:"Ludus",F:"Pragma"}, items:[{q:27,text:"My most important concern is that my partner is happy."},{q:28,text:"I enjoy having many romantic partners."},{q:29,text:"I feel that my partner and I were always going to end up together."},{q:30,text:"I want to be friends first and then let romance develop later."},{q:31,text:"I always feel either very excited or absolutely miserable about my relationship."},{q:32,text:"I prefer to keep many aspects of my love life to myself."},{q:33,text:"When I am in love, that is all I can think about."},{q:34,text:"I know before I meet someone what qualities I need in a partner."}] },
            { type:"tfng", title:"Questions 35–40", instructions:["Do the following statements agree with the claims of the writer?","Choose YES / NO / NOT GIVEN."], customChoices:["YES","NO","NOT GIVEN"], items:[{q:35,text:"People’s notions of love affect their relationships, rather than vice versa."},{q:36,text:"Some of our love stories are more important to us than others."},{q:37,text:"Our love stories can change to meet the needs of particular social environments."},{q:38,text:"We look for romantic partners with a love story just like our own."},{q:39,text:"The most successful partners have matching love stories."},{q:40,text:"No love story is more suited to a long relationship than any other."}] }
          ]
        }
      ]
    }
  };

  if (R.TESTS && R.TESTS.byId && R.TESTS.byId.ielts2) {
    R.TESTS.byId.ielts2.content = test2;
  }
})();
