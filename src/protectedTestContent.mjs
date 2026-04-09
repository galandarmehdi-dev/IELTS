/* src/protectedTestContent.mjs */
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

export const PROTECTED_TEST_CONTENT = {
  ielts5: test5,
  ielts6: test6,
  ielts7: test7,
};

export function getProtectedTestContent(testId) {
  return PROTECTED_TEST_CONTENT[String(testId || '').trim()] || null;
}
