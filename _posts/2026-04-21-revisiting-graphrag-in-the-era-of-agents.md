---
title: "Revisiting GraphRAG in the Era of Agents"
date: 2026-04-21
tags: [LLM, GraphRAG, Search Agent]
excerpt: "Personal reflections on GraphRAG's role today — why it still matters for global queries over large knowledge bases, and why search agents may eventually subsume it."
---

Over the past year, my focus has shifted from GraphRAG to search agents. However, GraphRAG remains an active area of research, continuing to attract significant attention and effort from the community. In this post, I'd like to share some of my personal thoughts on where it stands today.

## Why Do We Need GraphRAG?

From my perspective, GraphRAG tries to solve a critical problem: how to extract the main ideas from a large, scattered knowledge base. Imagine a literary researcher maintaining a large knowledge base containing several copyrighted novels — available for research purposes only — which means LLMs have never seen them during training. When the researcher wants to ask an LLM about the overarching themes, or the commonalities across these novels, the LLM must retrieve from the knowledge base and synthesize an answer. For traditional RAG, this is a nearly impossible task: the model can only view a small slice of the knowledge base at a time, never the full picture, making it unable to capture global patterns. GraphRAG addresses this by pre-building a hierarchical knowledge graph at multiple levels of granularity — from fine-grained details to high-level abstractions. The model can then grasp the main ideas of the knowledge base through these abstractive summaries, making such global queries feasible.

Before discussing GraphRAG variants, I want to clarify the distinction between **GraphRAG** and **RAG on/with Graphs**. GraphRAG, in my view, means leveraging a graph structure for a global, holistic understanding of an entire knowledge base, with the goal of enabling the model to respond correctly to global queries. In contrast, RAG on/with Graphs means leveraging graph structures to enhance retrieval — examples include HippoRAG and LinearRAG.

The variants of GraphRAG — such as LightRAG, E²GraphRAG, and HyperGraphRAG — mainly focus on improving retrieval quality and reducing cost. I won't go into the details here; I encourage you to read these papers directly.

## What About Search Agents?

Search agents, which have been flourishing recently, are especially adept at deep search tasks like multi-hop question answering. Ideally, if we could equip search agents with an infinite context window, they could subsume GraphRAG entirely from a capability perspective. Unfortunately, we can't — at least not yet. Search agents are still constrained by limited context windows and the noise introduced by retrieval results, which is precisely what keeps GraphRAG methods relevant.

But what if memory systems mature and search agents become capable of conducting long-horizon tasks? That would be transformative — though not welcome news for researchers focused solely on RAG on/with Graphs. Once agents can retrieve multi-hop evidence autonomously, we would no longer need ingeniously designed graph search algorithms. We could simply tell the agent what we want to know, and it would search, validate, summarize, and aggregate autonomously. The agent would need only the most straightforward tools — embedding search, grep, web search — rather than artfully crafted graph algorithms.

And what about GraphRAG, which pre-aggregates knowledge within a knowledge base? It faces a similar existential challenge. For information aggregation at scale, we can never pre-build a graph for the entire internet — but deep research agents can gather and aggregate information from anywhere, whether in private or public settings.

I believe we should bet on the technologies of the future, not just those that work for now. That conviction is why I've stepped away from GraphRAG research and moved into the search agent space.

Good luck to all of us!
