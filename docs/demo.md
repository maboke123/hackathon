# Demo

The demo for the idea "Legal rulebook with an owner for every rule" ([ideas.md](ideas.md)). It shows two things: the knowledge graph answering a real question, and the graph maintaining itself after a call ends.

Everything uses the synthetic knowledge corpus in `apps/web/src/lib/data/seed/knowledge` (answer key: `ground-truth.json`). All people, customers and calls are fictional. Payroll figures are simulated and must be labelled that way on screen.

## The story in one sentence

A service colleague gets the brief's urgent phone question, today she gives the wrong answer from three conflicting documents, with our graph she gives the right one in seconds, and when she hangs up the graph fixes itself so the next colleague and the next customer are right too.

## Cast

| Who             | Role in the demo                                                                         | Corpus id       |
| --------------- | ---------------------------------------------------------------------------------------- | --------------- |
| Lotte Verhaegen | Payroll consultant, Customer service Belgium (SME). Takes the calls.                     | `p-lotte`       |
| Inge Claes      | HR manager at Havenkaai Logistics, the caller.                                           | `cus-havenkaai` |
| Youssef Benali  | Warehouse worker at Havenkaai (arbeider, PC 140.03), just became a father.               | `cus-havenkaai` |
| Pieter De Smedt | Legal expert, Legal knowledge centre Belgium. Owns the birth leave and indexation rules. | `p-pieter`      |
| Bram Claessens  | Team lead, Customer service Belgium. Owns his team's SharePoint site.                    | `p-bram`        |
| Ellen Goossens  | Knowledge manager. Watches coverage.                                                     | `p-ellen`       |

## Run sheet

About four minutes. Scenes 1 to 3 are the core; cut scene 4 if time is short.

| Time | Scene                           | Screen                                  | What the jury should remember                              |
| ---- | ------------------------------- | --------------------------------------- | ---------------------------------------------------------- |
| 0:00 | 0. Today                        | Call transcript and the three documents | Three sources, no way to choose, wrong answer              |
| 0:30 | 1. The same call with the graph | Service screen with rule card and graph | The right answer, with owner, source and scope, in seconds |
| 1:30 | 2. The call ends                | After-call panel and the graph changing | The graph updates itself, people only confirm              |
| 2:30 | 3. A question nobody wrote down | Review queue of Pieter                  | Knowledge from a Teams chat becomes a shared, owned rule   |
| 3:30 | 4. The owner's view             | Coverage overview                       | Every rule has an owner and a verified date, per country   |
| 3:50 | Close                           | Slide                                   | One line and the scale argument                            |

## Scene 0: today (30 seconds)

Replay call-01 (`calls/call-01-havenkaai-geboorteverlof.txt`), 30 September, 09:12.

- Inge calls: Youssef became a father, how many days of birth leave, and who pays?
- Lotte asks the internal assistant and gets three documents:
  - "Werkinstructie geboorteverlof": 15 days, no owner.
  - "Birth leave quick guide": 15 days, "modified last week" (23 September).
  - "Geboorteverlof": one week plus five weeks via UWV. That is the Dutch rule.
- Lotte picks 15 days because two of three agree and one was edited last week.
- The truth is 20 days. At 11:48 Inge emails: Youssef found 20 days on his health fund's website (`emails/mail-12`).

Say: "Two documents agree, one was updated last week, and both are wrong. The update was a template migration. Nobody checked the content."

Show on screen: the "modified by svc-template-migration" line in the metadata of doc-01 and doc-02.

## Scene 1: the same call with the graph (60 seconds)

Same call, same question. Lotte has Havenkaai open in her service screen.

1. **Scope is set by context.** The screen already knows: Belgium, customer Havenkaai, employee Youssef Benali, arbeider, PC 140.03. Lotte does not type any of this.
2. **Lotte types "geboorteverlof".** The match is against rule cards, not against documents.
3. **The rule card appears:**
   - Birth leave, Belgium: 20 days. First 3 days paid by the employer at 100%, the other 17 by the health insurance fund at 82% of capped gross. To be taken within 4 months of the birth.
   - Valid since 1 January 2023.
   - Owner: Pieter De Smedt, Legal knowledge centre Belgium.
   - Last verified: 12 June 2026 (annual review). Next review: June 2027.
   - Legal source: Law of 3 July 1978 on employment contracts, article 30 §2, and the Programme Law of 20 December 2020.
4. **Supporting documents, each with a label:**
   - "Geboorteverlof, België" (doc-05): current, cites this version.
   - "Werkinstructie geboorteverlof" (doc-01) and "Birth leave quick guide" (doc-02): outdated, they cite the old version of 15 days (valid 2021 to 2022).
   - "Geboorteverlof" (doc-03): other scope, Netherlands.
   - The copy Bram emails from his OneDrive (doc-04, the brief's fourth document): uncontrolled copy, and it misses the 4 month rule.
5. **Graph view.** One click opens the graph around this rule: the rule in the middle, its three versions (10 days until 2020, 15 days in 2021 and 2022, 20 days since 2023), Pieter as owner, the legal source, the Belgium scope and the documents pointing at the version they cite. Outdated documents point at an old version, so you can see why they are wrong.

Say: "Edited is not verified. The graph knows which version of the rule each document states, so it knows which ones are out of date."

Lotte answers 20 days, 3 paid by Havenkaai, 17 by the health fund.

## Scene 2: the call ends (60 seconds)

Lotte hangs up. The after-call panel appears and the graph changes on screen. The jury sees each step light up.

| Step                              | What happens                                                                                                                                                                                                | Automatic or a person                                      |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Record the call                   | The call is linked to customer Havenkaai, to the ticket (SR-2026-048213) and to the rule version used (birth leave, 20 days).                                                                               | Automatic                                                  |
| Draft the confirmation            | A confirmation email to Inge is drafted from the rule card, with the numbers and the source.                                                                                                                | Lotte reads and clicks send                                |
| Flag the documents that misled    | doc-01 and doc-02 cite a superseded version and were just shown to a colleague. doc-02 goes to Bram's queue as "update to 20 days or retire". doc-01 has no owner, so it goes to Bram as "claim or retire". | Automatic flag, Bram decides                               |
| Demote them for everyone          | Until Bram decides, the assistant and search show doc-01 and doc-02 below the rule card, marked outdated.                                                                                                   | Automatic                                                  |
| Find past answers that were wrong | Other calls and tickets that cite the 15 day version are listed for the team lead: customers who may have been told 15 days.                                                                                | Automatic list, the team lead decides whether to call back |
| Strengthen the rule               | The rule card records one more use this month. Frequently used rules get reviewed first.                                                                                                                    | Automatic                                                  |

Then switch to Bram's queue for a moment: he clicks "retire" on doc-01 and "link to rule, update value" on doc-02. Both labels turn green.

Say: "Nobody had to remember to fix anything. The call itself told the graph what was missing. People only confirm."

## Scene 3: a question nobody wrote down (60 seconds)

Now call-03 (`calls/call-03-havenkaai-indexering.txt`), 25 September. Inge asks what to budget for January 2027 for staff above EUR 4,000, because of the new indexation cap (the "centenindex"). The only document is "Indexering PC 200, januari 2026" (doc-08), which does not mention a cap. Lotte does not know and promises a callback. This is ticket SR-2026-047981, still open.

1. **The call ends with a gap.** The rule search found no current rule for "indexation cap above EUR 4,000", and the call ended with a callback promise. The pipeline records a knowledge gap on the topic "indexation, Belgium, private sector".
2. **The graph looks for the knowledge elsewhere.** It finds Pieter's answer in the Teams channel Legal Belgium, Questions (`chats/chat-03`, 14 July) and the legal newsletter of June 2026 (`emails/mail-05`). The knowledge exists, but only in a chat and an inbox.
3. **A draft rule card goes to Pieter's review queue.** It shows the proposed rule next to the two sources:
   - Wages above EUR 4,000 gross are only indexed on the first EUR 4,000. The part above is not indexed. PC 200 indexes in January, so the first private sector effect is January 2027.
   - Pieter's example from the chat: at EUR 5,200 the new wage would be EUR 5,350.40 instead of EUR 5,395.52 (forecast 3.76%, not final).
4. **Pieter confirms in one click** and corrects one word. He becomes the owner. The rule is now shared, owned and verified.
5. **The graph updates:**
   - doc-08 is flagged "partly outdated: misses the cap" and goes to its owner.
   - Lotte gets a callback task with the answer ready and a simulated calculation for the Havenkaai employees above EUR 4,000 from the payroll sample data.
   - The knowledge gap is closed.

Say: "The answer was in a Teams chat for two months. Now it is a rule with an owner, and every colleague gets it."

## Scene 4: the owner's view (20 seconds)

Ellen's coverage overview:

- Rules per country and topic, with the share that has an owner and is verified on time.
- Open review items per owner, oldest first.
- Documents that cite outdated versions, with how often they were shown this month.

Say: "This is what the brief asked for: every piece of knowledge has an owner, a verified date and a scope."

## Close (10 seconds)

"We did not build another agent or another search box. We built the layer underneath: a graph of rules, owners and sources that keeps itself up to date, so the agent you already have gives answers people can trust."

Optional scale slide: the graph stores rules, owners and links, not files. Files stay in SharePoint and Teams. Rough size at SD Worx scale: tens of thousands of rules, millions of documents, a few kilobytes of links per document.

## What runs after every call

The pipeline behind scene 2 and 3, for the slide and for building it.

1. Transcript and metadata come in (queue, colleague, customer, ticket).
2. Topics are detected and matched to rule cards within the customer's scope.
3. The rule versions actually used in the call are linked to the call record.
4. Documents shown during the call that cite an outdated version, or that are out of scope, are flagged and routed to their owner, or to the site owner if they have none.
5. A callback promise or "I don't know" with no matching rule creates a knowledge gap. Existing sources (chats, mails, meeting notes) are searched and a draft rule goes to the most likely owner.
6. Other calls and tickets that cite the same outdated version are listed for the team lead.

AI only does steps 2 and 5 (matching topics, drafting a rule from sources). Everything else is plain logic on the graph. No output reaches a customer and no rule changes without a person.

## Screens to build

| Priority | Screen                                                                                                      | Needed for                   |
| -------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Must     | Service screen: customer context, rule search, rule card with trust label, supporting documents with status | Scene 1                      |
| Must     | Graph view of one rule: versions, owner, source, scope, documents citing each version                       | Scene 1                      |
| Must     | After-call panel with the steps lighting up one by one                                                      | Scene 2                      |
| Must     | Review queue for an owner: proposal next to its sources, confirm, correct or reject in one click            | Scenes 2 and 3               |
| Should   | Coverage overview                                                                                           | Scene 4                      |
| Should   | Call replay for scene 0 (transcript plus the three documents)                                               | Scene 0 (a slide also works) |
| Stretch  | Drafted confirmation email and callback task                                                                | Scenes 2 and 3               |

## Data we need

In the corpus already: people, customers, calls, chats, emails, documents, tickets, the agent log and the ground truth.

To add:

- **Rule cards with versions** for the facts in `ground-truth.json`, at least: birth leave Belgium (10, 15 and 20 days), birth leave Netherlands, meal vouchers (EUR 8 and EUR 10), the indexation cap. Each with owner, scope, valid from, legal source and last verified date.
- **Links** from documents, calls and tickets to the rule version they state. The ground truth already says which item agrees or disagrees with which fact, so these can be seeded.
- **Precomputed AI output** for scene 2 and 3 (topics found in call-01 and call-03, the draft rule from chat-03 and mail-05), so the demo does not depend on a live model or the venue wifi. If there is time, run the real step live and fall back to the stored result.

## Fallbacks

- Keep a screen recording of the full run as a backup.
- Keep the scene 0 story on a slide in case the call replay screen is not ready.
- Reset button to put the demo back in its starting state between rehearsals.

## Things we must not show

- No emotion or sentiment analysis of calls. We only use the transcript for topics and rules (see the red flags in [ideas.md](ideas.md)).
- No email to a customer sent without a person clicking send.
- No rule change without its owner.

## Open questions

- In call-03 Inge says her white-collar staff are in PC 200, but `docs/sample-data.md` puts Havenkaai's bedienden in PC 226. Align the corpus or the sample data before the demo.
- Which rule to use in the graph view slide if the jury asks for a second example: meal vouchers (call-02, Veldra, ticket SR-2026-047102 told a customer EUR 8) is ready in the corpus.
