---
title: "From Information Driven to Experience Driven"
date: 2026-09-20
tags: [RSI, LLM, Agent]
lang: en
published: false
excerpt: "As information becomes easier to acquire, the harder questions concern what to retain from experience, when to turn it into rules, and how to validate it. Reflections on LazyMem, experience transfer, the gap between claims and evaluations, and second-order self-improvement."
---

**TL;DR: As information becomes easier to acquire, we still seem unsure how to organize experience into information that remains useful in the future. When we distill experience, we do not yet know all the ways it will be used. When we apply it, we must decide which lessons deserve to become rules and which still need validation. And if we claim that a system is self-evolving, our evaluations should answer a further question: has it become better at completing tasks, or has it also become better at improving itself?**

For a long time, I worked on RAG. My starting point was straightforward: LLMs cannot store everything in their parameters, and a model whose parameters remain largely fixed after deployment does not automatically keep up with the world. New papers, internal documents, and recent events need to enter its context through external retrieval. My question then was how to find the things the model needed to know.

I gradually moved toward search agents. If one retrieval step was insufficient, the model could search again. If a question required multiple steps, it could use the clues it had found to decide what to do next. Models could navigate the web, revise queries, cross-check sources, and organize information. Search became an action within task execution.

Along the way, I increasingly felt that search was becoming a basic capability of agents. There may still be difficult search problems, but when even [BrowseComp](https://arxiv.org/abs/2504.12516), designed specifically around hard-to-find answers, appears close to saturation, being able to search independently starts to feel like a default requirement. On some information-gathering tasks, the breadth and persistence agents demonstrate are difficult even for a human researcher familiar with the field to match.

As information became easier to acquire, my attention shifted: after an agent has searched, tried, and failed, what does it carry into the next task?

Meanwhile, I have seen more and more familiar RAG problems reframed under the narrative of Memory. We still discuss storage, organization, retrieval, and updates, but now the objects are called memories. At the implementation level, writing text to a database and retrieving it later can look very much like a document collection. The difference becomes clearer when we consider how the content was produced.

Papers, tutorials, and manuals have usually already been organized by people. An author has selected what matters, explained the necessary background, and preserved the conditions attached to a conclusion. Before a document reaches the retriever, someone has often already turned its contents into knowledge that can be communicated.

An agent's raw experience can contain tool outputs, repeated attempts, mistaken hypotheses, temporary files, and accidental successes. Tens of thousands of tokens of trajectory may yield little reusable knowledge, while an apparently trivial error message could be crucial to a future diagnosis. What interests me about the information in an experience is how much it can help a future decision.

Raw experience is not necessarily friendly to existing retrievers, either. Two tasks described in entirely different terms may fail for the same reason. Two seemingly similar tasks may require different approaches because one assumption has changed. Retrieving a relevant experience still leaves the question of how to learn from it.

The natural move is to ask the model to compress the experience first: extract the key steps, analyze failures, write down lessons learned, and use them on the next task. [Reflexion](https://arxiv.org/abs/2303.11366), which uses verbal reflection and memory to let feedback inform subsequent attempts, illustrates this approach.

But I think the hardest part is this: **we need to distill experience according to its future uses, yet those uses are not fully known when we do the distillation.**

Suppose an agent modifies some code, encounters failing tests, and eventually resolves the problem by changing a dependency version. We could summarize the experience as, "When you see this error, check the dependency versions." But the original trajectory might contain much more: the error appeared only in one environment, a particular test kept passing, and another seemingly reasonable fix broke compatibility.

If the future task is simply to reproduce the fix, a short conclusion may be enough. If it is to explain why two environments behave differently, the details that were compressed away become important. The same experience calls for different information to be retained depending on the question we ask of it.

Shorter compression, or even a more faithful summary of the original trajectory, does not automatically imply greater future usefulness. Distilling memory at write time implicitly predicts future tasks: what will be worth retaining, and what probably will not be needed again.

This is also a motivation we discuss in [LazyMem](https://arxiv.org/abs/2607.22690). Compression at write time may discard details that future queries need, so we defer memory construction to query time: retrieve candidate content first, then select and compress it according to the current question. At least by then, we know what we are looking for on this occasion.

That does not eliminate all the difficulties of organizing experience. Keeping raw records leaves retrieval and reasoning costs to the future. Distilling them early requires making selection and attribution decisions now. Even if the original records remain accessible, a system may spend most of its time relying on a few summaries. The interesting questions are which decisions can be deferred, which content deserves preparation in advance, and when the system should return to the original evidence.

Even after a lesson has been distilled, we still have to decide how it should be used.

One question I want to study next is: **which lessons deserve to become fixed rules, which should remain conditional advice, and which need further validation?**

Consider the lesson, "Run the relevant tests after modifying code." It could be stored in memory, waiting to be retrieved. It could enter the agent's general instructions, making it available across more tasks. Or it could be implemented directly in the harness, automatically triggering checks after a modification. By harness, I mean the surrounding mechanisms that govern an agent's tools, context management, and execution flow.

From this perspective, memory and harness code can be different ways for the same lesson to influence action. Memory usually still requires retrieval, interpretation, and selection; a harness can act directly. The more deeply a lesson is built into execution, the more reliably we can enforce it, but the more carefully we need to examine its scope.

An environment-specific debugging suggestion mistakenly retrieved once has a different cost from the same suggestion turned into a procedure every task must follow. Conversely, repeatedly retrieving and reasoning through a well-validated lesson with clear applicability conditions can waste resources, or leave it forgotten when it matters most.

So I care about both where a lesson is stored and what status it should have. After one success, it may be only a candidate explanation. After holding up across different settings, it may become reliable advice. When its triggering conditions can be checked explicitly, there is a stronger case for turning it into an execution rule. When counterexamples appear, it should be possible to revise it, narrow its scope, or withdraw it altogether.

This is a research question I want to explore, rather than a method I have already validated: can a system use evidence to decide how broadly a lesson should apply and how strongly it should constrain execution?

People encounter similar problems when learning mathematics. Reading a solution and copying it into a notebook can help us remember a particular problem. To solve a different problem later, we need to understand why the method works, which conditions are indispensable, and when to try something else.

Take using parity to evaluate integrals. A student might memorize, "The integral of an odd function is zero." Or they might understand that, assuming integrability, an odd function's contributions cancel over an interval symmetric about zero. Those two understandings produce the same answer on some problems and very different answers on others.

If a function satisfies `f(c+t) = -f(c-t)` over an integration interval `[c-a, c+a]`, can the student recognize the same structure after a translation? If the function is odd but the interval becomes `[0, 1]`, will they still write down zero? If there is no useful symmetry, are they willing to abandon that approach promptly?

When we say someone has digested and internalized an experience, this kind of conditional transfer is usually what we expect. Rote memorization preserves the steps without adequately preserving the relationship between those steps and their conditions. A useful trick can easily become a habit applied everywhere.

If an agent's accumulated experience produces the same rigidity, it may become better at one class of tasks while becoming worse at another. More experience does not automatically produce better judgment.

Unfortunately, the narratives in my feed tend to move faster. Organize experience as text and write it into memory: Memory. Change the structure and introduce a few compression schemes: another paper. Call a model with stronger coding capabilities to modify the harness based on that experience, and the story becomes self-evolution.

These approaches have real technical differences and deserve investigation. [Darwin Gödel Machine](https://arxiv.org/abs/2505.22954), for example, explores modifying its own code, evaluating changes on coding tasks, and maintaining a collection of candidate agents. But the connection between what changed in a system and what capability it gained still has to be established experimentally.

Memory, self-improving, self-evolving, RSI: the hype and buzzwords take turns in the spotlight. Scrolling through my feed feels like witnessing several atomic explosions a day, each supposedly leaving me stunned and slumped in my chair. Then another one arrives.

When I finally get up, I still want to ask: what, exactly, has evolved?

**My biggest frustration is that the scope of the claims often far exceeds the scope of the evaluations.** Improvements on retries become evidence of learning from experience. Gains on one task distribution are extended into claims about general continual learning. Rising scores across successive versions become part of a story about RSI. Each of these steps requires evidence that cannot simply be skipped.

A method that works only in a clearly defined domain can be a solid contribution. If the claim is that it improves success rates on a particular class of tasks, independent testing and cost comparisons in that setting are valuable. But if the claim extends to transferable experience, or to a continuing capacity for self-evolution, the evaluation needs to extend with it.

Returning to the integration example, I would like to see a small experiment along these lines: let an agent accumulate experience on a set of problems involving parity, then freeze that experience and evaluate it on several groups of held-out tasks.

| Subsequent tasks | What they help distinguish |
| --- | --- |
| Change the function while preserving the solution structure | Whether the gain goes beyond remembering the original problems |
| Move the center of symmetry away from zero | Whether knowledge transfers to problems with different surface forms but the same structure |
| Preserve the function's symmetry but change the integration interval | Whether the conditions under which the lesson holds have been learned |
| Use integration problems where symmetry does not help | Whether the new experience introduces fixation or additional overhead |
| Evaluate other tasks within the experience's scope of influence | Whether capabilities regress or strategies transfer inappropriately |

We could also compare different ways of handling the experience: retaining raw trajectories, generating summaries, incorporating lessons into execution, and giving a system no access to this experience but a comparable compute budget. The experience-based approaches should use the same source experiences and explicitly report the costs of constructing and using their representations.

Such an experiment does not tell us in advance which method is best. It helps distinguish very different explanations for a gain: remembering more answers, learning rules with clearer applicability conditions, executing existing knowledge more reliably, or mainly benefiting from additional computation. If the gains appear only in the first group of tasks, the paper may still make a valid contribution. Its claims should stay within what the evidence supports.

Average scores can hide these differences. Positive transfer can offset negative transfer, and higher success rates can come with more wasted attempts. A single aggregate score makes it difficult to tell what a lesson actually changed. For memory or harness changes shared across many tasks, examining other capabilities within their scope of influence is particularly important.

This is why I see budgets, test boundaries, and metrics as central to the research problem, rather than experimental details added at the end of a paper.

The budget should cover trajectory generation, reflection, candidate search, calls to stronger external models, training, and failed experiments. It should also distinguish the upfront investment from the cost of each subsequent use. How many times must a lesson be reused before its construction cost pays off? If the baseline must answer directly while a new method gets substantial compute to search for a better system first, we should at least put that investment on the same bill.

Test boundaries determine whether we are measuring optimization or generalization. Once feedback from a task set participates in memory updates, code changes, or version selection, that set has entered the optimization loop. Even without reference answers, repeatedly selecting versions based on their performance can lead to adaptation to those tasks. Generalization needs to be assessed on independent tasks that did not participate in those decisions.

When the claim reaches recursive self-improvement, adding more downstream tasks is still insufficient. I want to bring the discussion explicitly to **second-order improvement**.

For this discussion, I call becoming better at completing tasks first-order improvement, and becoming better at producing subsequent improvements second-order improvement. This is a distinction I am making for the argument here, not an established universal definition of RSI.

A fixed, strong model can repeatedly propose changes to an agent, evaluate them, and select better versions. Task scores may keep rising. That demonstrates that the optimization process can find improvements. Rising scores alone do not establish that the later system is better than the earlier one at continuing to improve itself.

The human analogy is the difference between learning an integration technique and learning how to organize practice, diagnose mistakes, and seek more useful feedback. The latter can help us use our time more effectively when learning new techniques later.

For agents, the question I want to ask is: **given the same budget for further improvement, is the evolved system better than its predecessor at discovering, evaluating, and implementing new improvements?**

Does it choose experiments that better distinguish competing explanations? Does it avoid repeating failed directions and reject ineffective changes more accurately? Can it achieve the same gain at lower cost, or a larger, generalizable gain at the same cost? These questions come closer to second-order improvement than the observation that the new version has a higher final score.

One possible diagnostic experiment would use the systems before and after evolution as separate "improvers." Give them the same set of starting agents and new development tasks, with equal access to tools, feedback, and budgets. Compare the gains their modifications produce on independent test tasks, and record the cost of reaching a target gain. This would at least reduce confounding from differences in initial task performance or remaining headroom.

We also need a fixed-improver control: keep the system proposing changes unchanged while allowing the agent being modified to continue evolving. If this already explains most of the gain, the additional value of the recursive relationship remains to be demonstrated. Conversely, if the updated improver is consistently more effective on new improvement tasks, that offers more direct evidence of second-order improvement.

This experiment alone would not establish open-ended, long-term RSI. To support that stronger claim, we would still need evidence that the improved ability to improve arose from the system's own improvement loop and continued to help across further rounds and new problems. But at least we would be measuring the "recursive" part of the story, instead of merely renaming a rising task score.

This is where much of my pessimism about today's stronger narratives comes from. We have many ways to make systems change, and many experiments showing local benefits from particular changes. Moving from local benefits to transferable experience, and then to second-order improvement, requires different evidence at each step.

With limited resources, I may not be able to run all the experiments I want before someone else produces the answers. Still, I want to put my vision on record.

With clear budgets and test boundaries, I would like agents to have more freedom. If humans prescribe what to summarize, which reflection template to use, which code to modify, and which experiment to run at every iteration, the learning we can observe is also constrained by that procedure.

I would rather give an agent a problem and a finite budget of GPU hours, then let it decide what to do next: prepare data, design a small controlled experiment, change a training setup, test a hypothesis about a failure, or stop pursuing an unpromising direction. Just like human researchers.

This brings the earlier questions together. The agent needs to extract something useful from past experiments, distinguish reliable conclusions from conjectures, and use that distinction to allocate its next unit of compute. A new experiment may, in turn, change how it selects experiments in the future.

In the short term, my expectations are quite concrete. Let LLMs handle their own data preparation, inspect data quality and mixture proportions, and monitor training curves over time. Let them use evidence to decide when to adjust hyperparameters, wait longer, or stop a run. Doing these things well would already save researchers substantial time.

In my experience, however, models are often better at explaining what has already happened. Give one a curve and it can list many possible causes. Offer a judgment and it can supply supporting reasons and qualifications. When the next decision requires spending a real budget, I still often have to make the final choice.

Suppose training loss is falling but validation performance is not improving. A model can suggest overfitting, a distribution mismatch, or evaluation noise. But should we inspect the data, rerun evaluations by subset, or continue training? These actions cost different amounts and rule out different hypotheses. A system capable of research needs to turn possible explanations into prioritized experiments.

When I say I want a model to tell me, "Trust me on this," I am asking for that decision-making ability. With incomplete information, it should still be able to make a testable choice: what to do first, how much to spend, and which result would change its mind. Past experience should make those choices increasingly effective.

I want it to say, "Trust me on this: run this small experiment first. It best distinguishes our two current hypotheses. If the result does not support this direction, I will drop it." Then I want it to run the experiment properly and actually update its judgment based on the result.

This is why I want to move from information driven to experience driven. Search makes it easier for agents to access information that the outside world has already organized. Learning from experience requires them to take on the work of selection, attribution, validation, and revision themselves. When experience also improves how they do that work, we move closer to a system capable of sustained growth.

Perhaps one day someone will build an LLM capable of RSI. Through continuing, independent evaluation, it will demonstrate that it is becoming both more capable and better at continuing to improve itself. At that point, RSI will finally have evidence worthy of the name.

And then we will all be out of a job.

If someone is going to put me out of a job anyway, why shouldn't it be me?
