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

  if (R.TESTS && R.TESTS.byId && R.TESTS.byId.ielts5) {
    R.TESTS.byId.ielts5.content = test5;
  }
})();
