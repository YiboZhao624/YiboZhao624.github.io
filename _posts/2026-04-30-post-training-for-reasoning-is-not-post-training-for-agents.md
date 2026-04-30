---
title: "Post-Training for Reasoning Is Not Post-Training for Agents"
date: 2026-04-30
tags: [LLM, Post-Training, Agents, RL]
excerpt: "Most new post-training methods are evaluated on math and reasoning benchmarks, not on genuinely agentic tasks. Why we should be more skeptical about claims that they transfer to long-horizon agentic settings."
---

Recent advances in post-training algorithms have taken over my social media feed. Every day seems to bring another claimed breakthrough: on-policy distillation, Rubric RL, self-distillation, and more. But there is a pattern I find difficult to ignore: most of these methods are evaluated almost exclusively on math and reasoning datasets, rather than on genuinely agentic benchmarks.

That raises a simple question: are these techniques actually better for agentic scenarios, or are we mostly seeing progress on a narrow class of tasks that are easy to measure and easy to publish?

At the moment, I lean toward the latter view, although I have not yet run enough experiments to fully validate it. My skepticism comes partly from recent papers. For example, *Self-Distillation Zero: Self-Revision Turns Binary Rewards into Dense Supervision* reports difficulty training Qwen3-4B in think mode even on math tasks. Meanwhile, *Rethink OPD* argues that on-policy distillation can fail when the teacher distribution is too far from the student's. My suspicion is that these issues become even worse in long-horizon agentic settings, where divergence compounds over trajectories and small distribution shifts accumulate into large behavioral errors.

A newly published paper, *TCOD*, further supports this concern by evaluating OPD in agentic settings and showing that it struggles in long-horizon training. Their proposed fix is simple: train the student from short horizons to long horizons, either from planning to execution (forward) or from execution back to planning (backward). While this curriculum-style strategy is intuitive, I do not think it is a satisfying solution. It mitigates the symptom, but it does not fully address the underlying mismatch between teacher and student distributions in long-horizon environments.

I have similar concerns about rubric-based RL. I have experimented with it in search-agent settings, and my impression is that methods that look promising in short-form reasoning tasks do not automatically transfer to environments where success depends on long-term planning, recovery from mistakes, and interaction with external tools. Part of the issue may be the evaluation setting itself: search-agent benchmarks usually care only about final-answer correctness, while rubric-based RL introduces more fine-grained rewards over the process. Those process rewards may improve local behavior without improving the final metric that actually matters.

This is also why I have become increasingly interested in process reward design for agents. Based on this intuition, I am currently conducting an empirical review of process rewards in search-agent training. If all goes well, I expect to release it in late May — stay tuned.

So my view is simple: post-training for reasoning is not post-training for agents, and we should stop pretending the gap is small. If a method claims to improve agents, then show me the long-horizon results, the tool-use results, the recovery results, and the failure cases — not just another math chart. More broadly, a method validated on math should be treated the same way we treat a new pretraining framework, data recipe, or optimizer validated on a 4B model: it is a positive signal, but not proof that it can survive the scaling ladder or remain effective in 1T-scale training. We should absolutely study these methods, reproduce them, and learn from them. But we should critique them with real skepticism. Right now, many of them look less like established solutions and more like possible directions: interesting, worth exploring, but still far from guaranteed breakthroughs.

If you are working on these problems too — OPD, rubric RL, process rewards, or agent post-training more broadly — I'd love to connect. I'm always happy to discuss ideas, compare notes, or explore collaboration.
