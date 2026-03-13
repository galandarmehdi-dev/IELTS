/* assets/js/tests/test3Content.js */
(function () {
  "use strict";

  window.IELTS = window.IELTS || {};
  window.IELTS.Registry = window.IELTS.Registry || {};
  const R = window.IELTS.Registry;

  const test3 = {
    listening: {
      audioSrc: "https://audio.ieltsmock.org/88_we%20(1).mp3",
      html: `
        <div class="listen-page" id="listenSec1">
          <div class="listen-block">
            <div class="listen-h">SECTION 1 — Questions 1–10</div>

            <div class="listen-card">
              <div class="listen-card-title">Questions 1–10</div>
              <div class="listen-inst">Complete the notes below. Write <b>NO MORE THAN TWO WORDS AND/OR A NUMBER</b> for each answer.</div>
              <div class="listen-card-title">Hilary Lodge Retirement Home</div>
              <div class="listen-example">
                <div><b>Example</b></div>
                <div>The name of the <b>manager</b> is Cathy.</div>
              </div>
              <div class="listen-notes">
                <div class="note-row"><b>Activities programme involving volunteers</b></div>
                <div class="note-row">Monday evenings: computer training</div>
                <div class="note-row bullet">• Training needed in how to produce <span class="qnum">1</span> <input data-lq="1" class="l-input"></div>
                <div class="note-row">Tuesday afternoons: singing</div>
                <div class="note-row bullet">• The home has a <span class="qnum">2</span> <input data-lq="2" class="l-input"> and someone to play it</div>
                <div class="note-row">Thursday mornings: growing <span class="qnum">3</span> <input data-lq="3" class="l-input"></div>
                <div class="note-row bullet">• The home doesn’t have many <span class="qnum">4</span> <input data-lq="4" class="l-input"> for gardening</div>
                <div class="note-row">Once a month: meeting for volunteers and staff</div>
                <div class="note-row"><b>Interview</b></div>
                <div class="note-row bullet">• Go in on <span class="qnum">5</span> <input data-lq="5" class="l-input">, any time</div>
                <div class="note-row bullet">• Interview with assistant called <span class="qnum">6</span> <input data-lq="6" class="l-input"></div>
                <div class="note-row bullet">• Address of home: 73 <span class="qnum">7</span> <input data-lq="7" class="l-input"> Road</div>
                <div class="note-row"><b>'Open house' days</b></div>
                <div class="note-row bullet">• Agreed to help on <span class="qnum">8</span> <input data-lq="8" class="l-input"></div>
                <div class="note-row bullet">• Will show visitors where to <span class="qnum">9</span> <input data-lq="9" class="l-input"></div>
                <div class="note-row bullet">• Possibility of talking to a <span class="qnum">10</span> <input data-lq="10" class="l-input"> reporter</div>
              </div>
            </div>
          </div>
        </div>

        <div class="listen-page hidden" id="listenSec2">
          <div class="listen-block">
            <div class="listen-h">SECTION 2 — Questions 11–20</div>

            <div class="listen-card">
              <div class="listen-card-title">Questions 11–15</div>
            <div class="listen-inst">Label the plan below. Write the correct letter, <b>A–H</b>, next to Questions 11–15.</div>
<div class="img-wrap" style="background:#fff;border:1px solid #d7dce5;border-radius:14px;padding:12px;margin-bottom:14px;">
  <img src="https://audio.ieltsmock.org/Screenshot%202026-03-13%20at%2021.50.32.png" alt="Plan of Learning Resource Centre (Ground Floor)" style="width:100%;height:auto;display:block;border-radius:10px;">
</div>
              <div class="note-row"><span class="qnum">11</span> Newspapers <input data-lq="11" class="l-input tiny"></div>
              <div class="note-row"><span class="qnum">12</span> Computers <input data-lq="12" class="l-input tiny"></div>
              <div class="note-row"><span class="qnum">13</span> Photocopier <input data-lq="13" class="l-input tiny"></div>
              <div class="note-row"><span class="qnum">14</span> Café <input data-lq="14" class="l-input tiny"></div>
              <div class="note-row"><span class="qnum">15</span> Sports books <input data-lq="15" class="l-input tiny"></div>
            </div>

            <div class="listen-card">
              <div class="listen-card-title">Questions 16–20</div>
              <div class="listen-inst">Complete the table below. Write <b>ONE WORD ONLY</b> for each answer.</div>
              <div class="listen-table-wrap">
                <table class="listen-table">
                  <thead><tr><th>Name</th><th>New responsibility</th></tr></thead>
                  <tbody>
                    <tr><td>Jenny Reed</td><td>Buying <span class="qnum">16</span> <input data-lq="16" class="l-input tiny"> for the Centre</td></tr>
                    <tr><td>Phil Penshurst</td><td>Help with writing <span class="qnum">17</span> <input data-lq="17" class="l-input tiny"> for courses</td></tr>
                    <tr><td>Tom Salisbury</td><td>Information on topics related to the <span class="qnum">18</span> <input data-lq="18" class="l-input tiny"></td></tr>
                    <tr><td>Saeed Aktar</td><td>Finding a <span class="qnum">19</span> <input data-lq="19" class="l-input tiny"></td></tr>
                    <tr><td>Shilpa Desai</td><td>Help with <span class="qnum">20</span> <input data-lq="20" class="l-input tiny"></td></tr>
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
              <div class="listen-card-title">Questions 21–27</div>
              <div class="listen-inst">What helped Stewart with each of the following stages in making his training film for museum employees? Choose <b>SEVEN</b> answers from the box and write the correct letter, <b>A–I</b>, next to Questions 21–27.</div>
              <div class="endings-box">
                <div><b>A</b> advice from friends</div>
                <div><b>B</b> information on a website</div>
                <div><b>C</b> being allowed extra time</div>
                <div><b>D</b> meeting a professional film maker</div>
                <div><b>E</b> good weather conditions</div>
                <div><b>F</b> getting a better computer</div>
                <div><b>G</b> support of a manager</div>
                <div><b>H</b> help from a family member</div>
                <div><b>I</b> work on a previous assignment</div>
              </div>
              <div class="note-row"><span class="qnum">21</span> finding a location <input data-lq="21" class="l-input tiny"></div>
              <div class="note-row"><span class="qnum">22</span> deciding on equipment <input data-lq="22" class="l-input tiny"></div>
              <div class="note-row"><span class="qnum">23</span> writing the script <input data-lq="23" class="l-input tiny"></div>
              <div class="note-row"><span class="qnum">24</span> casting <input data-lq="24" class="l-input tiny"></div>
              <div class="note-row"><span class="qnum">25</span> filming <input data-lq="25" class="l-input tiny"></div>
              <div class="note-row"><span class="qnum">26</span> editing <input data-lq="26" class="l-input tiny"></div>
              <div class="note-row"><span class="qnum">27</span> designing the DVD cover <input data-lq="27" class="l-input tiny"></div>
            </div>

            <div class="listen-card">
              <div class="listen-card-title">Questions 28–30</div>
              <div class="listen-inst">Complete the notes below. Write <b>ONE WORD ONLY</b> for each answer.</div>
              <div class="listen-card-title">Stewart’s work placement: benefits to the Central Museum Association</div>
              <div class="listen-notes">
                <div class="note-row bullet">• his understanding of the Association’s <span class="qnum">28</span> <input data-lq="28" class="l-input"></div>
                <div class="note-row bullet">• the reduction in expense</div>
                <div class="note-row bullet">• increased co-operation between <span class="qnum">29</span> <input data-lq="29" class="l-input"></div>
                <div class="note-row bullet">• continuous <span class="qnum">30</span> <input data-lq="30" class="l-input"> which led to a better product</div>
                <div class="note-row bullet">• ideas for distribution of the film</div>
              </div>
            </div>
          </div>
        </div>

        <div class="listen-page hidden" id="listenSec4">
          <div class="listen-block">
            <div class="listen-h">SECTION 4 — Questions 31–40</div>

            <div class="listen-card">
              <div class="listen-card-title">Questions 31–40</div>
              <div class="listen-inst">Complete the notes below. Write <b>ONE WORD ONLY</b> for each answer.</div>
              <div class="listen-card-title">New Caledonian crows and the use of tools</div>
              <div class="listen-notes">
                <div class="note-row"><b>Examples of animals using tools</b></div>
                <div class="note-row bullet">• some chimpanzees use stones to break nuts</div>
                <div class="note-row bullet">• Betty (New Caledonian crow) made a <span class="qnum">31</span> <input data-lq="31" class="l-input"> out of wire to move a bucket of food</div>
                <div class="note-row bullet">• Barney (New Caledonian crow) used sticks to find food</div>
                <div class="note-row"><b>New Zealand and Oxford experiment</b></div>
                <div class="note-row bullet">• three stages: crows needed to move a <span class="qnum">32</span> <input data-lq="32" class="l-input"> in order to reach a short stick; then use the short stick to reach a long stick; then use the long stick to reach food</div>
                <div class="note-row"><b>Oxford research</b></div>
                <div class="note-row bullet">• crows used sticks to investigate whether there was any <span class="qnum">33</span> <input data-lq="33" class="l-input"> from an object</div>
                <div class="note-row bullet">• research was inspired by seeing crows using tools on a piece of cloth to investigate a spider design</div>
                <div class="note-row bullet">• Barney used a stick to investigate a snake made of <span class="qnum">34</span> <input data-lq="34" class="l-input"></div>
                <div class="note-row bullet">• Pierre used a stick to investigate a <span class="qnum">35</span> <input data-lq="35" class="l-input"></div>
                <div class="note-row bullet">• Corbeau used a stick to investigate a metal toad</div>
                <div class="note-row bullet">• the crows only used sticks for the first contact</div>
                <div class="note-row"><b>Conclusions of above research</b></div>
                <div class="note-row bullet">• ability to plan provides interesting evidence of the birds’ cognition</div>
                <div class="note-row bullet">• unclear whether this is evidence of the birds’ <span class="qnum">36</span> <input data-lq="36" class="l-input"></div>
                <div class="note-row"><b>Exeter and Oxford research in New Caledonia</b></div>
                <div class="note-row bullet">• scientists have attached very small cameras to birds’ <span class="qnum">37</span> <input data-lq="37" class="l-input"></div>
                <div class="note-row bullet">• food in the form of beetle larvae provides plenty of <span class="qnum">38</span> <input data-lq="38" class="l-input"> for the birds</div>
                <div class="note-row bullet">• larvae’s specific <span class="qnum">39</span> <input data-lq="39" class="l-input"> composition can be identified in birds that feed on them</div>
                <div class="note-row bullet">• scientists will analyse what the birds include in their <span class="qnum">40</span> <input data-lq="40" class="l-input"></div>
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
      task1Html: `You should spend about 20 minutes on this task.<br>
The pie charts give information about the world's forest in five different regions.<br>
Summarise the information by selecting and reporting the main features, and make comparisons where relevant.<br>
<b>Write at least 150 words.</b>`,
      task1ImageSrc: "https://ieltscity.vn/wp-content/uploads/2024/08/de-thi-ielts-writing-task-1-ngay-07-10-2024-updated.jpg",
      task2Html: `You should spend about 40 minutes on this task.<br><br>
Today more people put their private information (address, telephone and plastic card numbers) online to do their daily activities (banking, shopping, socializing).<br>
<b>Is it a positive or negative development?</b><br>
Give reasons for your answer and include any relevant examples from your own knowledge or experience.<br>
<b>Write at least 250 words.</b>`
    },
    reading: {
      parts: [
        {
          id: "part1",
          passageText: `The Phoenicians: an almost forgotten people

The Phoenicians inhabited the region of modern Lebanon and Syria from about 3000 BC. They became the greatest traders of the pre-classical world, and were the first people to establish a large colonial network. Both of these activities were based on seafaring, an ability the Phoenicians developed from the example of their maritime predecessors, the Minoans of Crete.

An Egyptian narrative of about 1080 BC, the Story of Wen-Amon, provides an insight into the sea-faring trading activity. One of the characters is Werek-Ba, a Phoenician merchant living at Tanis in Egypt. Little more than 50 ships carry out his business, plying back and forth between the Nile and the Phoenician port of Sidon.

The most prosperous period for Phoenicia was the 10th century BC, when the surrounding region was stable. Hiram, the king of the Phoenician city of Tyre, was an ally and business partner of Solomon, king of Israel. For Solomon's temple in Jerusalem, Hiram provided craftsmen with particular skills that were needed for this major construction project. He also supplied materials - particularly timber, including cedar from the forests of Lebanon. And the two kings went into trade in partnership. They sent out Phoenician vessels on long expeditions (of up to three years for return trips) to bring back gold, sandalwood, ivory, monkeys and peacocks from Ophir. This is an unidentified place, probably on the east coast of Africa or the west coast of India.

Phoenicia was famous for its luxury goods. The cedar wood was not only exported as top-quality timber for architecture and shipbuilding. It was also carved by the Phoenicians, and the same skill was adapted to even more precious work in ivory. The rare and expensive dye for cloth, Tyrian purple, complemented another famous local product, fine linen. The metalworkers of the region, particularly those working in gold, were famous. Tyre and Sidon were also known for their glass.

These were the main products which the Phoenicians exported. In addition, as traders and middlemen, they took a commission on much larger trade of precious goods that they transported from elsewhere.

The extensive trade of Phoenicia required much shipbuilding and correspondingly, a need for the field of writing that the Phoenicians made their most lasting contribution to world history. The scripts in use in the world up to the second millennium BC in Egypt, Mesopotamia or China all required the writer to learn a large number of separate characters - each of them expressing either a whole word or an element of its meaning. By contrast, the Phoenicians, in about 1500 BC, developed an entirely new approach to writing. The marks made (with a pointed tool called a stylus, on damp clay) now intended to capture the sound of a word. This required an alphabet of individual letters.

The trading and seafaring skills of the Phoenicians resulted in a network of colonies, spreading westwards through the Mediterranean. The first was probably Citium, in Cyprus, established in the 9th century BC. But the main expansion came from the 8th century BC onwards, when pressure from Assyria to the east disrupted the patterns of trade on which the Phoenician coast depended.

Trading colonies were developed on the fringe islands in the centre of the Mediterranean - Crete, Sicily, Malta, Sardinia, Ibiza - and also on the coast of north Africa. The African colonies clustered in particular around the great promontory which, with Sicily opposite, forms the narrowest channel in the Mediterranean sea route. This is the site of Carthage, the largest of the towns founded by the Phoenicians on the north African coast, and it rapidly assumed a leading position among the newly founded colonies. The traditional date of its founding is 814 BC, but archaeological evidence suggests that it was probably settled a little over a century later.

The subsequent spread and growth of Phoenician colonies in the western Mediterranean, and even out to the Atlantic coasts of Africa and Spain, was as much the achievement of Carthage as of original Phoenician trading cities such as Tyre and Sidon. But local interests remained with the homeland, and new colonies continued to travel west.

From the 8th century BC, many of the coastal cities of Phoenicia came under the control of repeated and imperial powers, each of them defeated and replaced in the region by the next: first the Assyrians, then the Babylonians, Persians and the Hellenistic Greek.

In 64 BC, the area of Phoenicia became part of the Roman province of Syria. The Phoenicians as an identifiable people then faded from history, merging into the populations of modern Lebanon and northern Syria.`,
          blocks: [
            { type: "sentenceGaps", title: "Questions 1–8", instructions: ["Complete the sentences below.", "Choose ONE WORD ONLY from the passage for each answer.", "Write your answers in the gaps."], items: [
              { q: 1, text: "The Phoenicians' skill at", tail: "helped them to trade." },
              { q: 2, text: "In an ancient story, a", tail: "from Phoenicia, who lived in Egypt, owned over 50 ships." },
              { q: 3, text: "A king of Israel built a", tail: "using supplies from Phoenicia." },
              { q: 4, text: "Phoenicia supplied Solomon with skilled", tail: "." },
              { q: 5, text: "The main material that Phoenicia sent to Israel was", tail: "." },
              { q: 6, text: "The kings of Phoenicia and Israel formed a business", tail: "in order to carry out trade." },
              { q: 7, text: "Phoenicians carved", tail: "as well as cedar." },
              { q: 8, text: "The Phoenicians also earned a", tail: "for shipping goods." }
            ]},
            { type: "tfng", title: "Questions 9–13", instructions: ["Do the following statements agree with the information given in Reading Passage 1?", "In boxes 9–13 on your answer sheet, write TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, or NOT GIVEN if there is no information on this."], items: [
              { q: 9, text: "Problems with Assyria led to the establishment of a number of Phoenician colonies." },
              { q: 10, text: "Carthage was an enemy town which the Phoenicians won in battle." },
              { q: 11, text: "Phoenicians reached the Atlantic ocean." },
              { q: 12, text: "Parts of Phoenicia were conquered by a series of empires." },
              { q: 13, text: "The Phoenicians welcomed Roman control of the area." }
            ]}
          ]
        },
        {
          id: "part2",
          passageText: `The Hollywood Film Industry

A This chapter examines the 'Golden Age' of the Hollywood film studio system and explores how a particular kind of filmmaking developed during this period in US film history. It also focuses on two key elements which influenced the emergence of the classic Hollywood studio system: the advent of sound and the business ideal of vertical integration. In addition to its historical interest, inspecting the growth of the studio system may offer clues regarding the factors of structural change within the growth of new media. It might, in fact, be intriguing to examine which changes occurred during the growth of the Hollywood studio, and compare those changes to contemporary struggles in which production companies are trying to define and control emerging industries, such as online film and interactive television.

B The shift of the industry away from 'silent' films began during the late 1920s. Warner Bros.' 1927 film The Jazz Singer was the first to feature synchronized speech and, with it, came a period of turmoil for the industry. Studios now had proof that talked films would make them money, but the financial investment this kind of filmmaking would require, from new camera equipment to new projection facilities, made the studios hesitant to invest at first. In the power of one nation seemed to be more audiences and enhance the story pervaded studios that talks were worth investing in. Overall, the use of sound in film was well-received by audiences, but there were still many technical factors to consider. Although full integration of sound into movies was complete by 1930, it would take somewhat longer for them to regain their stylistic elegance and dexterity. The camera now had to be encased in a big, clumsy, unmovable soundproof box. In addition, actors struggled, having to direct their speech to awkwardly-hidden microphones in huge plants, telephones or even costumes.

C Vertical integration is the other key component in the rise of the Hollywood studio system. The major studios realized they could increase their profits by handling each stage of a film's life: production (making the film), distribution (getting the film out to people) and exhibition (owning the theaters in major cities where films were shown first). Five studios, The Big Five, worked to achieve vertical integration through the mid 1940s, owning first and second run which to construct elaborate sets. In addition, these studios set the exact terms of films' release dates and patterns. Warner Bros., Paramount, 20th Century Fox, MGM and RKO formed this exclusive club. The Little Three - Universal, Columbia and United Artists - also maintained their own kind of vertical integration. Together these eight companies operated as a mature oligopoly, essentially running the entire market.

D During the Golden Age, the studios were remarkably consistent and stable enterprises, due in large part to long-term management heads - the infamous 'movie moguls' who ruled their kingdoms with iron fists. At MGM, Warner Bros. and Columbia, the same men ran their studios for decades. The rise of the studio system also hinges on the treatment of stars, who were constructed and exploited to suit a studio's image and schedule. Actors were bound up in seven-year contracts to a single studio, and the studio bosses generally held all the options. Stars could be loaned out to other production companies at any time. Studio bosses could also force bad roles on actors. and manipulate every single detail of stars' images with their mammoth in-house publicity departments. Some have compared the Hollywood studio system to a factory, and it is useful to remember that studios were out to make money first and art second.

E On the other hand, studios also had to cultivate flexibility, in addition to consistent factory output. Studio heads realized that they couldn't make virtually the same film over and over again with the same cast of stars and still expect to keep turning a profit. They also had to create product differentiation. Examining how production companies tried to differentiate products can lend itself to broader conceptualisations of individual studios' styles. MGM tended to put out a lot of all-star productions while Paramount excelled in comedy and Warner Bros. developed a reputation for gritty social realism. 20th Century Fox forged the musical and a great deal of prestige biographies, while Universal specialized in classic horror movies.

F In 1948, struggling independent movie producers and exhibitors finally triumphed in their battle against the big studios' monopolistic behavior. In the United States versus Paramount federal decree of that year, the studios were ordered to give up their theaters in what is commonly referred to as divestiture - opening the market to smaller producers. This, coupled with the advent of television in the 1950s, seriously compromised the studio system's influence and profits. Hence, 1930 and 1948 are generally considered bookends to Hollywood's Golden Age.`,
          blocks: [
            { type: "headings", title: "Questions 14–19", instructions: ["Reading Passage 2 has six paragraphs, A–F.", "Choose the correct heading for each paragraph from the list of headings below.", "Write the correct number, i–viii, in boxes 14–19 on your answer sheet."], listTitle: "List of Headings", headings: [
              { value: "i", label: "The power within each studio" },
              { value: "ii", label: "The movie industry adapts to innovation" },
              { value: "iii", label: "Contrasts between cinema and other media of the time" },
              { value: "iv", label: "The value of studying Hollywood's Golden Age" },
              { value: "v", label: "Distinguishing themselves from the rest of the market" },
              { value: "vi", label: "A double attack on film studios' power" },
              { value: "vii", label: "Gaining control of the industry" },
              { value: "viii", label: "The top movies of Hollywood's Golden Age" }
            ], questions: [
              { q: 14, paragraph: "Paragraph A" },
              { q: 15, paragraph: "Paragraph B" },
              { q: 16, paragraph: "Paragraph C" },
              { q: 17, paragraph: "Paragraph D" },
              { q: 18, paragraph: "Paragraph E" },
              { q: 19, paragraph: "Paragraph F" }
            ] },
            { type: "tfng", title: "Questions 20–23", instructions: ["Do the following statements agree with the information in Reading Passage 2?", "In boxes 20–23 on your answer sheet, write TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, or NOT GIVEN if there is no information on this."], items: [
              { q: 20, text: "After The Jazz Singer came out, other studios immediately began making movies with synchronized sound." },
              { q: 21, text: "There were some drawbacks to recording movie actors' voices in the early 1930s." },
              { q: 22, text: "There was intense competition between actors for contracts with the leading studios." },
              { q: 23, text: "Studios had total control over how their actors were perceived by the public." }
            ] },
            { type: "sentenceGaps", title: "Questions 24–26", instructions: ["Complete the summary below.", "Choose NO MORE THAN TWO WORDS from the passage for each answer.", "Write your answers in boxes 24–26 on your answer sheet."], items: [
              { q: 24, text: "Throughout its Golden Age, the Hollywood movie industry was controlled by a handful of studios. Using a system known as", tail: ", the biggest studios not only made movies, but handled their distribution and then finally showed them in their own theaters." },
              { q: 25, text: "These studios were often run by autocratic bosses – men known as", tail: " who often remained at the head of organisations for decades." },
              { q: 26, text: "However, the domination of the industry by the leading studios came to an end in 1948, when they were forced to open the market to smaller producers – a process known as", tail: "." }
            ] }
          ]
        },
        {
          id: "part3",
          passageText: `Left or right?

An overview of some research into lateralisation: the dominance of one side of the body over the other

A Creatures across the animal kingdom have a preference for one foot, eye or even antenna. The cause of this trait, called lateralisation, is fairly simple: one side of the brain, which generally controls the opposite side of the body, is more dominant than the other when processing certain tasks. This does, on some occasions, let the animal down: such as when a food tile is snapped up by the stronger eye from the right, but because its right eye is worse at spotting danger than its left. So why would animals evolve a characteristic that seems to endanger them?

B For many years it was assumed that lateralisation was a uniquely human trait, but this notion rapidly fell apart as researchers started uncovering evidence of lateralisation in all sorts of animals. For example, in the 1970s, Lesley Rogers, now at the University of New England in Australia, was studying memory and learning in chicks. She had been injecting a chemical into chicks' brains to stop them learning how to spot grains of food among distracting pebbles, and was surprised to observe that the chemical only worked when applied to the left hemisphere of the brain. That strongly suggested that the right side of the brain played little or no role in the learning of such behaviours. Similar evidence appeared in songbirds and rats around the same time, and since then, researchers have built up an impressive catalogue of animal lateralisation.

C In some animals, lateralisation is simply a preference for a single paw or foot, while others it appears in more general patterns of behaviour. The left side of most vertebrate brains, for example, seems to process and control feeding. Since the left hemisphere processes input from the right side of the body, that means animals with their left heads and birds are more likely to tuck prey or food items viewed via their right side. Even humpback whales prefer to use the right side of their jaws to scrape and sift from the ocean floor.

D Genetics plays a part in determining lateralisation, but environmental factors have an impact too. Rogers found that a chick's lateralisation depends on whether it is exposed to light before hatching from its egg - if it is kept in the dark during this period, neither hemisphere becomes dominant. In 2004, Rogers tested this observation, letting chicks with either strong or weak lateralisation feed while distracting them with some identical red beads. When she then presented the two groups with overheads and omitted some pebbles and the threatening shape of a fox predator flying overhead. As predicted, the birds incubated in the light looked for food mainly with their right eye, while using the other to check out the predator. The weakly-lateralised chicks, meanwhile, had difficulty performing these two activities simultaneously.

E Similar results probably hold true for many other animals. In 2006, Angelo Bisazza at the University of Padua set out to observe the differences in feeding behavior between strongly-lateralised and weakly-lateralised fish. He found that strongly-lateralised individuals were able to feed twice as fast as weakly-lateralised ones when there was a threat of a predator looming above them. Assigning different jobs to different brain halves may be especially advantageous for animals such as birds or fish, whose eyes are placed on the sides of their heads. This enables them to process input from each eye separately, with different tasks in mind.

F And what of those animals who favour a specific side for almost all tasks? In 2009, Maria Magat and Culum Brown at Macquarie University in Australia wanted to see if there was general cognitive advantage in lateralisation. To investigate, they turned to parrots, which can be either strongly right- or left-footed, or ambidextrous (without dominant limb). The parrots were given the intellectually demanding task of pulling a snack on a string up to their beaks, using a coordinated combination of claws and beak. The result showed that the parrots with the strongest foot preferences worked out the puzzle more quickly than their ambidextrous peers.

G A further puzzle is why are there always a few exceptions, like left-handed humans, who are wired differently from the majority of the population? Giorgio Vallortigara, and Stefano Ghirlanda of Stockholm University seem to have solved the issue via mathematical models. These back up the idea that in life is better to answer an attack with the fewest casualties if the majority turn together in one direction while a very small proportion of the group escape in the direction that the predator is not expecting.

H This imbalance of lateralisation within populations may also have advantages for individuals. Whereas most co-operative interactions require participants to react similarly, there are some situations - such as aggressive interactions - where it can benefit an individual to launch an attack from an unexpected quarter. Perhaps this can partly explain the existence of left-handers in human society. It has been suggested that when it comes to hand-to-hand fighting, left-handers may have the advantage over the right-handed majority. Where survival depends on the element of surprise, it may indeed pay to be different.`,
          blocks: [
            { type: "endingsMatch", title: "Questions 27–30", instructions: ["Complete each sentence with the correct ending, A–F, below.", "Write the correct letter, A–F, in boxes 27–30 on your answer sheet."], endings: {
              A: "lateralisation is more common in some species than in others.",
              B: "it benefits a population if some members have a different lateralisation than the majority.",
              C: "lateralisation helps animals to do two things at the same time.",
              D: "lateralisation is not confined to human beings.",
              E: "the greater an animal's lateralisation, the better it is at problem-solving.",
              F: "strong lateralisation may sometimes put groups of animals in danger."
            }, items: [
              { q: 27, text: "In the 1970s, Lesley Rogers discovered that" },
              { q: 28, text: "Angelo Bisazza's experiments revealed that" },
              { q: 29, text: "Magat and Brown's studies show that" },
              { q: 30, text: "Vallortigara and Ghirlanda's research findings suggest that" }
            ] },
            { type: "sentenceGaps", title: "Questions 31–35", instructions: ["Complete the summary below.", "Choose ONE WORD ONLY from the passage for each answer.", "Write your answers in boxes 31–35 on your answer sheet."], items: [
              { q: 31, text: "Lateralisation is determined by both genetic and", tail: " influences." },
              { q: 32, text: "Rogers found that chicks whose eggs are given", tail: " during the incubation period tend to have a stronger lateralisation." },
              { q: 33, text: "Her 2004 experiment set out to prove that these chicks were better at", tail: " than weakly lateralised chicks." },
              { q: 34, text: "As expected, the strongly lateralised birds in the experiment were more able to locate", tail: " using their right eye, while using their left eye to monitor an imitation" },
              { q: 35, inlineWithPrevious: true, text2: " located above them." }
            ] },
            { type: "endingsMatch", title: "Questions 36–40", instructions: ["Reading Passage 3 has eight paragraphs, A–H.", "Which paragraph contains the following information?", "Write the correct letter, A–H, in boxes 36–40 on your answer sheet. You may use any letter more than once."], endings: {
              A: "Paragraph A",
              B: "Paragraph B",
              C: "Paragraph C",
              D: "Paragraph D",
              E: "Paragraph E",
              F: "Paragraph F",
              G: "Paragraph G",
              H: "Paragraph H"
            }, items: [
              { q: 36, text: "description of a study which supports another scientist's findings" },
              { q: 37, text: "the suggestion that a person could gain from having an opposite lateralisation to most of the population" },
              { q: 38, text: "reference to the large amount of knowledge of animal lateralisation that has accumulated" },
              { q: 39, text: "research findings that were among the first to contradict a previous belief" },
              { q: 40, text: "a suggestion that lateralisation would seem to disadvantage animals" }
            ] }
          ]
        }
      ]
    }
  };

  if (R.TESTS && R.TESTS.byId && R.TESTS.byId.ielts3) {
    R.TESTS.byId.ielts3.content = test3;
  }
})();
