/* assets/js/tests/test4Content.js */
(function () {
  "use strict";

  window.IELTS = window.IELTS || {};
  window.IELTS.Registry = window.IELTS.Registry || {};
  const R = window.IELTS.Registry;

  const test4 = {
    listening: {
      audioSrc: "https://audio.ieltsmock.org/87_we.mp3",
      html: `
        <div class="listen-page" id="listenSec1">
          <div class="listen-block">
            <div class="listen-h">SECTION 1 — Questions 1–10</div>

            <div class="listen-card">
              <div class="listen-card-title">Questions 1–6</div>
              <div class="listen-inst">Complete the table below. Write <b>NO MORE THAN ONE WORD OR A NUMBER</b> for each answer.</div>
              <div class="listen-card-title">Hostel Accommodation in Darwin</div>
              <div class="listen-table-wrap">
                <table class="listen-table">
                  <thead>
                    <tr><th>Name</th><th>Price per person</th><th>Comments and reviews</th></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Top End Backpackers</td>
                      <td>$19</td>
                      <td>
                        parking available<br>
                        staff are <span class="qnum">1</span> <input data-lq="1" class="l-input tiny"><br>
                        nice pool<br>
                        air conditioning is too <span class="qnum">2</span> <input data-lq="2" class="l-input tiny">
                      </td>
                    </tr>
                    <tr>
                      <td>Gum Tree Lodge</td>
                      <td><span class="qnum">3</span> <input data-lq="3" class="l-input tiny"></td>
                      <td>
                        good quiet location<br>
                        pool and gardens<br>
                        <span class="qnum">4</span> <input data-lq="4" class="l-input tiny"> in the dormitories
                      </td>
                    </tr>
                    <tr>
                      <td>Kangaroo Lodge</td>
                      <td>$22</td>
                      <td>
                        downtown location<br>
                        reception always open<br>
                        no lockers in the rooms<br>
                        the <span class="qnum">5</span> <input data-lq="5" class="l-input tiny"> are very clean<br>
                        seems to be a <span class="qnum">6</span> <input data-lq="6" class="l-input tiny"> every night
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="listen-card">
              <div class="listen-card-title">Questions 7–10</div>
              <div class="listen-inst">Complete the notes below. Write <b>ONE WORD ONLY</b> for each answer.</div>
              <div class="listen-card-title">Kangaroo Lodge</div>
              <div class="listen-notes">
                <div class="note-row">Address: on <span class="qnum">7</span> <input data-lq="7" class="l-input"> Lane</div>
                <div class="note-row"><b>General information about hostel accommodation</b></div>
                <div class="note-row bullet">Sheets are provided</div>
                <div class="note-row bullet">Can hire a <span class="qnum">8</span> <input data-lq="8" class="l-input"></div>
                <div class="note-row bullet"><span class="qnum">9</span> <input data-lq="9" class="l-input"> is included</div>
                <div class="note-row bullet">A shared <span class="qnum">10</span> <input data-lq="10" class="l-input"> is available</div>
              </div>
            </div>
          </div>
        </div>

        <div class="listen-page hidden" id="listenSec2">
          <div class="listen-block">
            <div class="listen-h">SECTION 2 — Questions 11–20</div>

            <div class="listen-card">
              <div class="listen-card-title">Questions 11–16</div>
              <div class="listen-inst">Choose the correct letter, <b>A, B or C</b>.</div>
              <div class="listen-card-title">Anglia Sculpture Park</div>
              <div class="mcq">
                <div class="mcq-q"><span class="qnum">11</span> The land where the Sculpture Park is located was previously</div>
                <label class="mcq-opt"><input type="radio" name="q11" value="A" data-lq-radio="11"> A) completely covered by forest</label>
                <label class="mcq-opt"><input type="radio" name="q11" value="B" data-lq-radio="11"> B) the site of a private house</label>
                <label class="mcq-opt"><input type="radio" name="q11" value="C" data-lq-radio="11"> C) occupied by a factory</label>
              </div>
              <div class="mcq">
                <div class="mcq-q"><span class="qnum">12</span> What is unusual about the Anglia Sculpture Park?</div>
                <label class="mcq-opt"><input type="radio" name="q12" value="A" data-lq-radio="12"> A) Artists have made sculptures especially for it</label>
                <label class="mcq-opt"><input type="radio" name="q12" value="B" data-lq-radio="12"> B) Some of its sculptures were donated by the artists</label>
                <label class="mcq-opt"><input type="radio" name="q12" value="C" data-lq-radio="12"> C) It only shows contemporary sculptures</label>
              </div>
              <div class="mcq">
                <div class="mcq-q"><span class="qnum">13</span> What is the theme of Joe Tremain’s “burnt” sculptures?</div>
                <label class="mcq-opt"><input type="radio" name="q13" value="A" data-lq-radio="13"> A) the contrast between nature and urban life</label>
                <label class="mcq-opt"><input type="radio" name="q13" value="B" data-lq-radio="13"> B) the effect of man on the environment</label>
                <label class="mcq-opt"><input type="radio" name="q13" value="C" data-lq-radio="13"> C) the violence of nature</label>
              </div>
              <div class="mcq">
                <div class="mcq-q"><span class="qnum">14</span> The path by the Lower Lake</div>
                <label class="mcq-opt"><input type="radio" name="q14" value="A" data-lq-radio="14"> A) is rather wet in some places</label>
                <label class="mcq-opt"><input type="radio" name="q14" value="B" data-lq-radio="14"> B) has recently been repaired</label>
                <label class="mcq-opt"><input type="radio" name="q14" value="C" data-lq-radio="14"> C) is difficult to walk on</label>
              </div>
              <div class="mcq">
                <div class="mcq-q"><span class="qnum">15</span> What does the speaker say about the Visitor Centre?</div>
                <label class="mcq-opt"><input type="radio" name="q15" value="A" data-lq-radio="15"> A) It is being enlarged at present</label>
                <label class="mcq-opt"><input type="radio" name="q15" value="B" data-lq-radio="15"> B) It has received an international award</label>
                <label class="mcq-opt"><input type="radio" name="q15" value="C" data-lq-radio="15"> C) It was designed by a Canadian architect</label>
              </div>
              <div class="mcq">
                <div class="mcq-q"><span class="qnum">16</span> Today, visitors can buy snacks and sandwiches</div>
                <label class="mcq-opt"><input type="radio" name="q16" value="A" data-lq-radio="16"> A) at the kiosk</label>
                <label class="mcq-opt"><input type="radio" name="q16" value="B" data-lq-radio="16"> B) in the Terrace Room</label>
                <label class="mcq-opt"><input type="radio" name="q16" value="C" data-lq-radio="16"> C) at the Lower Lake Cafe</label>
              </div>
            </div>

            <div class="listen-card">
              <div class="listen-card-title">Questions 17–20</div>
              <div class="listen-inst">Label the map below. Write the correct letter, <b>A–F</b>, next to Questions 17–20.</div>
              <div class="img-wrap" style="background:#fff;border:1px solid #d7dce5;border-radius:14px;padding:12px;margin-bottom:14px;">
                <img src="https://practicepteonline.com/wp-content/uploads/2024/09/lis-test87.png" alt="Map of Anglia Sculpture Park" style="width:auto;max-width:100%;max-height:420px;height:auto;display:block;margin:0 auto;border-radius:10px;">
              </div>
              <div class="note-row"><span class="qnum">17</span> Joe Tremain sculptures <input data-lq="17" class="l-input tiny"></div>
              <div class="note-row"><span class="qnum">18</span> Giorgio Catalucci bird sculptures <input data-lq="18" class="l-input tiny"></div>
              <div class="note-row"><span class="qnum">19</span> Garden gallery <input data-lq="19" class="l-input tiny"></div>
              <div class="note-row"><span class="qnum">20</span> Long house <input data-lq="20" class="l-input tiny"></div>
            </div>
          </div>
        </div>

        <div class="listen-page hidden" id="listenSec3">
          <div class="listen-block">
            <div class="listen-h">SECTION 3 — Questions 21–30</div>

            <div class="listen-card">
              <div class="listen-card-title">Questions 21–26</div>
              <div class="listen-inst">Choose the correct letter, <b>A, B or C</b>.</div>
              <div class="listen-card-title">Marketing report</div>
              <div class="mcq">
                <div class="mcq-q"><span class="qnum">21</span> Why did Leo choose instant coffee as the topic for his marketing report?</div>
                <label class="mcq-opt"><input type="radio" name="q21" value="A" data-lq-radio="21"> A) He found plenty of material on the topic</label>
                <label class="mcq-opt"><input type="radio" name="q21" value="B" data-lq-radio="21"> B) He had some practical experience in the area</label>
                <label class="mcq-opt"><input type="radio" name="q21" value="C" data-lq-radio="21"> C) He had an idea of a brand he wanted to target</label>
              </div>
              <div class="mcq">
                <div class="mcq-q"><span class="qnum">22</span> Leo discovered that in Australia, recent technological developments</div>
                <label class="mcq-opt"><input type="radio" name="q22" value="A" data-lq-radio="22"> A) are producing less healthy types of instant coffee</label>
                <label class="mcq-opt"><input type="radio" name="q22" value="B" data-lq-radio="22"> B) are reducing the demand for instant coffee</label>
                <label class="mcq-opt"><input type="radio" name="q22" value="C" data-lq-radio="22"> C) are improving the quality of instant coffee</label>
              </div>
              <div class="mcq">
                <div class="mcq-q"><span class="qnum">23</span> What do the speakers agree about Leo’s table of coffee products?</div>
                <label class="mcq-opt"><input type="radio" name="q23" value="A" data-lq-radio="23"> A) It needs more explanation in the text</label>
                <label class="mcq-opt"><input type="radio" name="q23" value="B" data-lq-radio="23"> B) It is factually inaccurate in some places</label>
                <label class="mcq-opt"><input type="radio" name="q23" value="C" data-lq-radio="23"> C) It would be best to put this in the appendix</label>
              </div>
              <div class="mcq">
                <div class="mcq-q"><span class="qnum">24</span> What do they decide about the description of Shaffers coffee as a market follower?</div>
                <label class="mcq-opt"><input type="radio" name="q24" value="A" data-lq-radio="24"> A) Leo needs to define his terms</label>
                <label class="mcq-opt"><input type="radio" name="q24" value="B" data-lq-radio="24"> B) Leo needs to provide more evidence</label>
                <label class="mcq-opt"><input type="radio" name="q24" value="C" data-lq-radio="24"> C) Leo needs to put it in a different section</label>
              </div>
              <div class="mcq">
                <div class="mcq-q"><span class="qnum">25</span> What does Anna say about originality in someone’s first marketing report?</div>
                <label class="mcq-opt"><input type="radio" name="q25" value="A" data-lq-radio="25"> A) Clear analysis of data can be considered original</label>
                <label class="mcq-opt"><input type="radio" name="q25" value="B" data-lq-radio="25"> B) Graphs and diagrams should be original, not copied</label>
                <label class="mcq-opt"><input type="radio" name="q25" value="C" data-lq-radio="25"> C) Reports should contain some original data collected by the student</label>
              </div>
              <div class="mcq">
                <div class="mcq-q"><span class="qnum">26</span> What difference between his school assignments and this report has surprised Leo?</div>
                <label class="mcq-opt"><input type="radio" name="q26" value="A" data-lq-radio="26"> A) not knowing the criteria for getting a good mark</label>
                <label class="mcq-opt"><input type="radio" name="q26" value="B" data-lq-radio="26"> B) being required to produce work without assistance</label>
                <label class="mcq-opt"><input type="radio" name="q26" value="C" data-lq-radio="26"> C) having to do a great deal of research</label>
              </div>
            </div>

            <div class="listen-card">
              <div class="listen-card-title">Questions 27–30</div>
              <div class="listen-inst">Complete the notes below. Write <b>ONE WORD ONLY</b> for each answer.</div>
              <div class="listen-card-title">Notes on specific sections of marketing report</div>
              <div class="listen-notes">
                <div class="note-row"><b>Executive summary</b></div>
                <div class="note-row bullet">Give a brief overview including the <span class="qnum">27</span> <input data-lq="27" class="l-input"></div>
                <div class="note-row"><b>Problems</b></div>
                <div class="note-row bullet">Link each problem to a <span class="qnum">28</span> <input data-lq="28" class="l-input"> which explains it</div>
                <div class="note-row"><b>Implementation</b></div>
                <div class="note-row bullet">Practical solutions to problems</div>
                <div class="note-row bullet">Include details such as participants, <span class="qnum">29</span> <input data-lq="29" class="l-input"> and sequence</div>
                <div class="note-row bullet">Section is often poorly done because of lack of <span class="qnum">30</span> <input data-lq="30" class="l-input"></div>
                <div class="note-row"><b>Conclusion</b></div>
                <div class="note-row bullet">Don’t use new material here</div>
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
              <div class="listen-card-title">History of fireworks in Europe</div>
              <div class="listen-notes">
                <div class="note-row"><b>13th–16th centuries</b></div>
                <div class="note-row bullet">Fireworks were introduced from China</div>
                <div class="note-row bullet">Their use was mainly to do with war and <span class="qnum">31</span> <input data-lq="31" class="l-input"> (in plays and festivals)</div>
                <div class="note-row"><b>17th century</b></div>
                <div class="note-row bullet">Various features of <span class="qnum">32</span> <input data-lq="32" class="l-input"> were shown in fireworks displays</div>
                <div class="note-row bullet">Scientists were interested in using ideas from fireworks displays to make human <span class="qnum">33</span> <input data-lq="33" class="l-input"> possible</div>
                <div class="note-row bullet">They also used them to show the formation of <span class="qnum">34</span> <input data-lq="34" class="l-input"></div>
                <div class="note-row"><b>London</b></div>
                <div class="note-row bullet">Scientists were distrustful at first</div>
                <div class="note-row bullet">Later they investigated <span class="qnum">35</span> <input data-lq="35" class="l-input"> uses of fireworks</div>
                <div class="note-row"><b>St Petersburg</b></div>
                <div class="note-row bullet">Fireworks were seen as a work of <span class="qnum">36</span> <input data-lq="36" class="l-input"> for people</div>
                <div class="note-row"><b>Paris</b></div>
                <div class="note-row bullet">Displays emphasized the power of the <span class="qnum">37</span> <input data-lq="37" class="l-input"></div>
                <div class="note-row bullet">Scientists aimed to provide <span class="qnum">38</span> <input data-lq="38" class="l-input"></div>
                <div class="note-row"><b>18th century</b></div>
                <div class="note-row bullet">Italian fireworks specialists became influential</div>
                <div class="note-row bullet">Servandoni’s fireworks display followed the same pattern as an <span class="qnum">39</span> <input data-lq="39" class="l-input"></div>
                <div class="note-row bullet">Some displays demonstrated new scientific discoveries such as <span class="qnum">40</span> <input data-lq="40" class="l-input"></div>
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
      `,
    },
    writing: {
      task1Type: "Map",
      task2Type: "Advantages and disadvantages",
      task1Html: `You should spend about 20 minutes on this task.<br>
        The two maps below show TV centre ten years ago and now.<br>
        Summarize the information by selecting and reporting the main features and make comparisons where relevant.<br>
        <b>Write at least 150 words.</b>`,
      task1ImageSrc: "https://audio.ieltsmock.org/enhanced_tv_centre.png",
      task2Html: `You should spend about 40 minutes on this task.<br><br>
        Many companies employ people from different age groups in the same team.<br>
        <b>Do the advantages of this outweigh the disadvantages?</b><br>
        Give reasons for your answer and include any relevant examples from your own knowledge or experience.<br>
        <b>Write at least 250 words.</b>`,
    },
    reading: {
      parts: [
        {
          id: "part1",
          passageText: `The hidden histories of exploration exhibition

A We have all heard tales of lone, heroic explorers, but what about the local individuals who guided and protected European explorers in many different parts of the globe? Or the go-betweens – including interpreters and traders – who translated the needs and demands of explorers into a language that locals could understand? Such questions have received surprisingly little attention in standard histories, where European explorers are usually the heroes, sometimes the villains. The Hidden Histories of Exploration exhibition at Britain’s Royal Geographical Society in London sets out to present an alternative view, in which exploration is a fundamentally collective experience of work, involving many different people. Many of the most famous examples of explorers said to have been 'lone travellers' – say, Mungo Park or David Livingstone in Africa – were anything but 'alone' on their travels. They depended on local support of various kinds – for food, shelter, protection, information, guidance and solace – as well as on other resources from elsewhere.

B The Royal Geographical Society (RGS) seeks to record this story in its Hidden Histories project, using its astonishingly rich collections. The storage of geographical information was one of the main rationales for the foundation of the RGS in 1830, and the Society’s collections now contain more than two million individual items, including books, manuscripts, maps, photographs, artworks, artefacts and film – a rich storehouse of material reflecting the wide geographical extent of British interest across the globe. In addition to their remarkable scope and range, these collections contain a striking visual record of exploration: the impulse to collect the world is reflected in a large and diverse image archive. For the researcher, this archive can yield many surprises: materials gathered for one purpose – say, maps relating to an international boundary dispute or photographs taken on a scientific expedition – may today be put to quite different uses.

C In their published narratives, European explorers rarely portrayed themselves as vulnerable or dependent on others, despite the fact that without this support they were quite literally lost. Archival research confirms that Europeans were not merely dependent on the work of porters, soldiers, translators, cooks, pilots, guides, hunters and collectors: they also relied on local expertise. Such assistance was essential in identifying potential dangers – poisonous species, unpredictable rivers, uncharted territories – which could mean the difference between life and death. The assistants themselves were usually in a strong bargaining position. In the Amazon, for example, access to entire regions would depend on the willingness of local crew members and other assistants to enter areas inhabited by relatively powerful Amerindian groups. In an account of his journey across South America published in 1836, William Smyth thus complained of frequent desertion by his helpers: without them it was impossible to get on.

D Those providing local support and information to explorers were themselves often not 'locals'. For example, the history of African exploration in the nineteenth century is dominated by the use of Zanzibar as a recruiting station for porters, soldiers and guides who would then travel thousands of miles across the continent. In some accounts, the leading African members of expedition parties – the 'officers' or 'foremen' – are identified, and their portraits published alongside those of European explorers.

E The information provided by locals and intermediaries was of potential importance to geographical science. How was this evidence judged? The formal procedures of scientific evaluation provided one framework. Alongside these were more 'common sense' notions of veracity and reliability, religiously inspired judgments about the authenticity of testimony, and the routine procedures for cross-checking empirical observations developed in many professions.

F Given explorers’ need for local information and support, it was in their interests to develop effective working partnerships with knowledgeable intermediaries who could act as brokers in their dealings with local inhabitants. Many of these people acquired far more experience of exploration than most Europeans could hope to attain. Some managed large groups of men and women, piloted the explorers’ river craft, or undertook mapping work. The tradition was continued with the Everest expeditions in the 1920s and 1930s, which regularly employed the Tibetan interpreter Karma Paul. In Europe, exploration was increasingly thought of as a career; the same might be said of the non-Europeans on whom their expeditions depended.

G These individuals often forged close working relationships with European explorers. Such partnerships depended on mutual respect, though they were not always easy or intimate, as is particularly clear from the history of the Everest expeditions depicted in the Hidden Histories exhibition. The entire back wall is covered by an enlarged version of a single sheet of photographs of Sherpas taken during the 1936 Everest expedition. The document is a powerful reminder of the manpower on which European mountaineering expeditions depended, and also of the importance of local knowledge and assistance. Transformed from archive to wall display, it tells a powerful story through the medium of individual portraits – including Karma Paul, veteran of previous expeditions, and the young Tensing Norgay, 17 years before his successful 1953 ascent. This was a highly charged and transitional moment as the contribution of the Sherpas, depicted here with identity tags round their necks, was beginning to be much more widely recognised. These touching portraits encourage us to see them as agents rather than simply colonial subjects or paid employees. Here is a living history, which looks beyond what we already know about exploration: a larger history in which we come to recognise the contribution of everyone involved.`,
          blocks: [
            {
              type: "tfng",
              title: "Questions 1–7",
              instructions: [
                "Do the following statements agree with the information given in Reading Passage 1?",
                "Choose TRUE / FALSE / NOT GIVEN.",
              ],
              items: [
                { q: 1, text: "The Hidden Histories of Exploration exhibition aims to show the wide range of people involved in expeditions." },
                { q: 2, text: "The common belief about how Park and Livingstone travelled is accurate." },
                { q: 3, text: "The RGS has organised a number of exhibitions since it was founded." },
                { q: 4, text: "Some of the records in the RGS archives are more useful than others." },
                { q: 5, text: "Materials owned by the RGS can be used in ways that were not originally intended." },
                { q: 6, text: "In their publications, European explorers often describe their dependence on their helpers." },
                { q: 7, text: "Local helpers refused to accompany William Smyth during parts of his journey." },
              ],
            },
            {
              type: "endingsMatch",
              title: "Questions 8–13",
              instructions: [
                "Reading Passage 1 has seven paragraphs, A–G.",
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
                G: "Paragraph G",
              },
              items: [
                { q: 8, text: "reference to the distances that some non-European helpers travelled" },
                { q: 9, text: "description of a wide range of different types of documents" },
                { q: 10, text: "belief about the effect of an exhibition on people seeing it" },
                { q: 11, text: "examples of risks explorers might have been unaware of without local help" },
                { q: 12, text: "reference to various approaches to assessing data from local helpers" },
                { q: 13, text: "reference to people whose long-term occupation was to organise local assistance for European explorers" },
              ],
            },
          ],
        },
        {
          id: "part2",
          passageText: `Fatal Attraction

Evolutionist Charles Darwin first marvelled at flesh-eating plants in the mid-19th century. Today, biologists, using 21st-century tools to study cells and DNA, are beginning to understand how these plants hunt, eat and digest – and how such bizarre adaptations arose in the first place.

A The leaves of the Venus flytrap plant are covered in hairs. When an insect brushes against them, this triggers a tiny electric charge, which travels down tunnels in the leaf and opens up pores in the leaf’s cell membranes. Water surges from the cells on the inside of the leaf to those on the outside, causing the leaf to rapidly flip in shape from convex to concave, like a soft contact lens. As the leaves flip, they snap together, trapping the insect in their sharp-toothed jaws.

B The bladderwort has an equally sophisticated way of setting its underwater trap. It pumps water out of tiny bag-like bladders, making a vacuum inside. When small creatures swim past, they bend the hairs on the bladder, causing a flap to open. The low pressure sucks water in, carrying the animal along with it. In one five-hundredth of a second, the door swings shut again. The Drosera sundew, meanwhile, has a thick, sweet liquid oozing from its leaves, which first attracts insects, then holds them fast before the leaves snap shut. Pitcher plants use yet another strategy, growing long tube-shaped leaves to imprison their prey. Raffles’ pitcher plant, from the jungles of Borneo, produces nectar that both lures insects and forms a slick surface on which they can’t get a grip. Insects that land on the rim of the pitcher slide on the liquid and tumble in.

C Many carnivorous plants secrete enzymes to penetrate the hard exoskeleton of insects so they can absorb nutrients from inside their prey. But the purple pitcher plant, which lives in bogs and infertile sandy soils in North America, enlists other organisms to process its food. It is home to an intricate food web of mosquito larvae, midges and bacteria, many of which can survive only in this unique habitat. These animals shred the prey that fall into the pitcher, and the smaller organisms feed on the debris. Finally, the plant absorbs the nutrients released.

D While such plants clearly thrive on being carnivorous, the benefits of eating flesh are not the ones you might expect. Carnivorous animals such as ourselves use the carbon in protein and the fat in meat to build muscles and store energy. Carnivorous plants instead draw nitrogen, phosphorus, and other critical nutrients from their prey in order to build light-harvesting enzymes. Eating animals, in other words, lets carnivorous plants do what all plants do: carry out photosynthesis, that is, grow by harnessing energy directly from the sun.

E Carnivorous plants are, in fact, very inefficient at converting sunlight into tissue. This is because of all the energy they expend to make the equipment to catch animals – the enzymes, the pumps, and so on. A pitcher or a flytrap cannot carry out much photosynthesis because, unlike plants with ordinary leaves, they do not have flat solar panels that can grab lots of sunlight. There are, however, some special conditions in which the benefits of being carnivorous do outweigh the costs. The poor soil of bogs, for example, offers little nitrogen and phosphorus, so carnivorous plants enjoy an advantage over plants that obtain these nutrients by more conventional means. Bogs are also flooded with sunshine, so even an inefficient carnivorous plant can photosynthesise enough light to survive.

F Evolution has repeatedly made this trade-off. By comparing the DNA of carnivorous plants with other species, scientists have found that they evolved independently on at least six separate occasions. Some carnivorous plants that look nearly identical turn out to be only distantly related. The two kinds of pitcher plants – the tropical genus Nepenthes and the North American Sarracenia – have, surprisingly, evolved from different ancestors, although both grow deep pitcher-shaped leaves and employ the same strategy for capturing prey.

G In several cases, scientists can see how complex carnivorous plants evolved from simpler ones. Venus flytraps, for example, share an ancestor with Portuguese sundews, which only catch prey passively, via 'flypaper' glands on their stems. They share a more recent ancestor with Drosera sundews, which can also curl their leaves over their prey. Venus flytraps appear to have evolved an even more elaborate version of this kind of trap, complete with jaw-like leaves.

H Unfortunately, the adaptations that enable carnivorous plants to thrive in marginal habitats also make them exquisitely sensitive. Agricultural run-off and pollution from power plants are adding extra nitrogen to many bogs in North America. Carnivorous plants are so finely tuned to low levels of nitrogen that this extra fertilizer is overloading their systems, and they eventually burn themselves out and die.

I Humans also threaten carnivorous plants in other ways. The black market trade in exotic carnivorous plants is so vigorous now that botanists are keeping the location of some rare species a secret. But even if the poaching of carnivorous plants can be halted, they will continue to suffer from other assaults. In the pine savannah of North Carolina, the increasing suppression of fires is allowing other plants to grow too quickly and outcompete the flytraps in their native environment. Good news, perhaps, for flies. But a loss for all who, like Darwin, delight in the sheer inventiveness of evolution.`,
          blocks: [
            {
              type: "sentenceGaps",
              title: "Questions 14–18",
              instructions: [
                "Complete the notes below.",
                "Choose NO MORE THAN TWO WORDS from the passage for each answer.",
              ],
              items: [
                { q: 14, text: "Insect touches", tail: " on leaf of plant" },
                { q: 15, text: "Small", tail: " passes through leaf" },
                { q: 16, text: "", leadingBlank: true, text2: " in cell membrane open" },
                { q: 17, text: "Outside cells of leaves fill with", tail: "" },
                { q: 18, text: "Leaves change so that they have a", tail: " shape and snap shut" },
              ],
            },
            {
              type: "endingsMatch",
              title: "Questions 19–22",
              instructions: [
                "Match each statement with the correct plant, A–E.",
                "Write the correct letter, A, B, C, D or E.",
              ],
              endings: {
                A: "Venus flytrap",
                B: "Bladderwort",
                C: "Drosera sundew",
                D: "Raffles’ pitcher plant",
                E: "Purple pitcher plant",
              },
              items: [
                { q: 19, text: "It uses other creatures to help it digest insects." },
                { q: 20, text: "It produces a slippery substance to make insects fall inside it." },
                { q: 21, text: "It creates an empty space into which insects are sucked." },
                { q: 22, text: "It produces a sticky substance which traps insects on its surface." },
              ],
            },
            {
              type: "endingsMatch",
              title: "Questions 23–26",
              instructions: [
                "Reading Passage 2 has nine paragraphs, A–I.",
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
                G: "Paragraph G",
                H: "Paragraph H",
                I: "Paragraph I",
              },
              items: [
                { q: 23, text: "a mention of a disadvantage of the leaf shape of some carnivorous plants" },
                { q: 24, text: "an example of an effort made to protect carnivorous plants" },
                { q: 25, text: "unexpected information about the origins of certain carnivorous plants" },
                { q: 26, text: "an example of environmental changes that shorten the life cycles of carnivorous plants" },
              ],
            },
          ],
        },
        {
          id: "part3",
          passageText: `Want to be friends?

A For many hundreds of thousands of people worldwide, online networking has become enmeshed in our daily lives. However, it is a decades-old insight from a study of traditional social networks that best illuminates one of the most important aspects of today’s online networking. In 1973 sociologist Mark Granovetter showed how the loose acquaintances, or 'weak ties', in our social network exert a disproportionate influence over our behaviour and choices. Granovetter’s research showed that a significant percentage of people get their jobs as a result of recommendations or advice provided by a weak tie. Today our number of weak-tie contacts has exploded via online social networking. 'You couldn’t maintain all of those weak ties on your own,' says Jennifer Golbeck of the University of Maryland. 'Online sites, such as Facebook, give you a way of cataloguing them.' The result? It’s now significantly easier for the schoolfriend you haven’t seen in years to pass you a tip that alters your behaviour, from recommendation of a low-cholesterol breakfast cereal to a party invite where you meet your future wife or husband.

B The explosion of weak ties could have profound consequences for our social structures too, according to Judith Donath of the Berkman Center for Internet and Society at Harvard University. 'We’re already seeing changes,' she says. For example, many people now turn to their online social networks ahead of sources such as newspapers and television for trusted and relevant news or information. What they hear could well be inaccurate, but the change is happening nonetheless. If these huge 'supernets' – some of them numbering up to 5,000 people – continue to thrive and grow, they could fundamentally change the way we share information and transform our notions of relationships.

C But are these vast networks really that relevant to us on a personal level? Robin Dunbar, an evolutionary anthropologist at the University of Oxford, believes that our primate brains place a cap on the number of genuine social relationships we can actually cope with: roughly 150. According to Dunbar, online social networking appears to be very good for 'servicing' relationships, but not for establishing them. He argues that our evolutionary roots mean we still depend heavily on physical and face-to-face contact to be able to create ties.

D Nonetheless, there is evidence that online networking can transform our daily interactions. In an experiment at Cornell University, psychologist Jeff Hancock asked participants to try to encourage other participants to like them via instant messaging conversation. Beforehand, some members of the trial were allowed to view the Facebook profile of the person they were trying to win over. He found that those with Facebook access asked questions to which they already knew the answers or raised things they had in common, and as result were much more successful in their social relationships. Hancock concluded that people who use these sites to keep updated on the activities of their acquaintances are more likely to be liked in subsequent social interactions.

E Online social networking may also have tangible effects on our well-being. Nicole Ellison of Michigan State University found that the frequency of networking site use correlates with greater self-esteem. Support and affirmation from the weak ties could be the explanation, says Ellison. 'Asking your close friends for help or advice is nothing new, but we are seeing a lowering of barriers among acquaintances,' she says. People are readily sharing personal feelings and experiences to a wider circle than they might once have done. Sandy Pentland at the Massachusetts Institute of Technology agrees. 'The ability to broadcast to our social group means we need never feel alone,' he says. 'The things that befall us are often due to a lack of social support. There’s more of a safety net now.'

F Henry Holzman, also at MIT, who studies the interface between online social networking and the real world, points out that increased visibility also means our various social spheres – family, work, friends – are merging, and so we will have to prepare for new societal norms. 'We’ll have to learn how to live a more transparent life,' he says. 'We may have to give up some ability to show very limited glimpses of ourselves to others.'

G Another way that online networking appears to be changing our social structures is through dominance. In one repeated experiment, Michael Kearns of the University of Pennsylvania asked 30 volunteers to quickly reach consensus in an online game over a choice between two colours. Each person was offered a cash reward if they succeeded in persuading the group to pick one or other colour. All participants could see the colour chosen by some of the other people, but certain participants had an extra advantage: the ability to see more of the participants’ chosen colours than others. Every time Kearns found that those who could see the choices of more participants (in other words, were better connected) persuaded the group to pick their colour, even when they had to persuade the vast majority to give up their financial incentive. While Kearns warns that the setting was artificial, he says it’s possible that greater persuasive power could lie with well-connected individuals in the everyday online world too.`,
          blocks: [
            {
              type: "headings",
              title: "Questions 27–32",
              instructions: [
                "Reading Passage 3 has seven paragraphs, A–G.",
                "Choose the correct heading for paragraphs B–G from the list of headings below.",
              ],
              listTitle: "List of Headings",
              headings: [
                { value: "i", label: "A shift in our fact-finding habits" },
                { value: "ii", label: "How to be popular" },
                { value: "iii", label: "More personal information being known" },
                { value: "iv", label: "The origins of online social networks" },
                { value: "v", label: "The link between knowledge and influence" },
                { value: "vi", label: "Information that could change how you live" },
                { value: "vii", label: "The emotional benefits of online networking" },
                { value: "viii", label: "A change in how we view our online friendships" },
                { value: "ix", label: "The future of networking" },
                { value: "x", label: "Doubts about the value of online socialising" },
              ],
              questions: [
                { q: 27, paragraph: "Paragraph B" },
                { q: 28, paragraph: "Paragraph C" },
                { q: 29, paragraph: "Paragraph D" },
                { q: 30, paragraph: "Paragraph E" },
                { q: 31, paragraph: "Paragraph F" },
                { q: 32, paragraph: "Paragraph G" },
              ],
            },
            {
              type: "endingsMatch",
              title: "Questions 33–36",
              instructions: [
                "Match each finding with the correct researcher, A–F.",
                "Write the correct letter, A–F.",
              ],
              endings: {
                A: "Mark Granovetter",
                B: "Judith Donath",
                C: "Robin Dunbar",
                D: "Jeff Hancock",
                E: "Nicole Ellison",
                F: "Michael Kearns",
              },
              items: [
                { q: 33, text: "People who network widely may be more able to exert pressure on others." },
                { q: 34, text: "We have become more willing to confide in an extensive number of people." },
                { q: 35, text: "There is a limit to how many meaningful relationships we can maintain." },
                { q: 36, text: "There is a social advantage in knowing about the lives of our online contacts." },
              ],
            },
            {
              type: "multiTextChoices",
              title: "Questions 37–40",
              instructions: [
                "For Questions 37–40, choose the correct letter, A–E.",
                "Questions 37 and 38 ask for TWO advantages mentioned in the passage.",
                "Questions 39 and 40 ask for TWO disadvantages mentioned in the passage.",
              ],
              choices: [
                { letter: "A", text: "Information from online social contacts may be unreliable." },
                { letter: "B", text: "Online socialising is an efficient way of keeping in touch with a lot of people." },
                { letter: "C", text: "It is very easy to establish new friendships online." },
                { letter: "D", text: "Online social networking can solve problems in real-world relationships." },
                { letter: "E", text: "It can be reassuring to be part of an online social network." },
              ],
              items: [
                { q: 37, text: "Advantage mentioned 1" },
                { q: 38, text: "Advantage mentioned 2" },
                { q: 39, text: "Disadvantage mentioned 1" },
                { q: 40, text: "Disadvantage mentioned 2" },
              ],
            },
          ],
        },
      ],
    },
  };

  if (R.TESTS && R.TESTS.byId && R.TESTS.byId.ielts4) {
    R.TESTS.byId.ielts4.content = test4;
  }
})();
