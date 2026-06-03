---
permalink: /
title: ""
excerpt: ""
author_profile: true
redirect_from: 
  - /about/
  - /about.html
---

{% if site.google_scholar_stats_use_cdn %}
{% assign gsDataBaseUrl = "https://cdn.jsdelivr.net/gh/" | append: site.repository | append: "@" %}
{% else %}
{% assign gsDataBaseUrl = "https://raw.githubusercontent.com/" | append: site.repository | append: "/" %}
{% endif %}
{% assign url = gsDataBaseUrl | append: "google-scholar-stats/gs_data_shieldsio.json" %}

<span class='anchor' id='about-me'></span>

I am currently a second-year post-graduate Student at the School of Data Science and Engineering, East China Normal University, under the supervision of [Prof. Xiang Li](https://lixiang3776.github.io/) in the PLANING (graPh mining and LANguage processING) lab.

My research interests include:
- **Large Language Models**: applications in GraphRAG ([E$^2$GraphRAG](https://arxiv.org/abs/2505.24226), [CrossAug](https://arxiv.org/abs/2605.28004), [CogGRAG](https://arxiv.org/abs/2503.06567)), toxicity detection ([MetaTox](https://arxiv.org/abs/2412.15268)), and detoxification ([GEM](https://arxiv.org/abs/2507.01050)).
- **Agentic Reinforcement Learning**: Search Agent ([Empirical Review](https://arxiv.org/abs/2605.27881), [GRACE](https://arxiv.org/abs/2601.04525)), Trajectory Doctor ([OS-Themis](https://arxiv.org/abs/2603.19191)), and skills related ([Skill0.5](https://arxiv.org/abs/2605.28424)).

<!-- <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 12px 16px; margin: 16px 0; font-size: 16px;">
  📢 <strong>I am actively looking for 2026 Summer Research Internships and 2027 Fall PhD positions.</strong> 
  Please feel free to <a href="mailto:yibozhao@stu.ecnu.edu.cn">contact me</a> if you have any relevant opportunities!
</div> -->

★★★ Feel free to reach out to me for academic discussions and collaborations!

<span class='anchor' id='publications'></span>

# 🔥 News
- *2026.05* 🎉🎉 4 new papers released on ArXiv, enjoy!
- *2026.04* 🔥🔥 Our work RATE is accepted by ACL 2026, see you in CA!
- *2026.01* 🎊🎊 Happy New Year! A recent work GRACE has been released on ArXiv!
<!--- *2025.11* 🎉🎉 Our work CogRAG is Accepted by AAAI 2026, see you in Singapore! -->
<!--- *2025.08* 🔥🔥 A new work on Text Detoxification has been accepted by EMNLP 2025 main conference! See you in Suzhou, China! -->
<!--- *2025.07* 🔥🔥 E$^2$GraphRAG has received 100 stars on [GitHub](https://github.com/YiboZhao624/E-2GraphRAG)! -->
{% include_relative includes/pub.md %}

# 📖 Educations
- *2024.09 - now*, Post-graduate student, Data Science and Engineering, East China Normal University  <img src='./images/logos/ecnu.png' style='width: 2.3em;'>
- *2020.09 - 2024.06*, Undergraduate, School of Communication, East China Normal University.  <img src='./images/logos/ecnu.png' style='width: 2.3em;'>


<!-- # 💬 Invited Talks
- *2021.06*, Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ornare aliquet ipsum, ac tempus justo dapibus sit amet. 
- *2021.03*, Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ornare aliquet ipsum, ac tempus justo dapibus sit amet.  \| [\[video\]](https://github.com/) -->


# 💻 Internships
- *2025.12 - 2026.06* Post-training Intern, LLM Center, AI Lab <img src='./images/logos/AILAB.png' style='width: 3em;'>, Shanghai, China.

# 🎲 Fun Facts

<div id="fun-fact-container" style="position: relative; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-radius: 12px; padding: 24px 28px; margin: 16px 0; min-height: 80px; display: flex; align-items: center; transition: all 0.3s ease;">
  <span id="fun-fact-text" style="font-size: 1.05em; line-height: 1.6; flex: 1; padding-right: 40px;"></span>
  <button onclick="showRandomFact()" title="Show another fact" style="position: absolute; top: 12px; right: 12px; background: none; border: none; cursor: pointer; font-size: 1.4em; opacity: 0.6; transition: opacity 0.2s, transform 0.3s; padding: 4px 8px;" onmouseover="this.style.opacity='1'; this.style.transform='rotate(180deg)'" onmouseout="this.style.opacity='0.6'; this.style.transform='rotate(0deg)'">🔄</button>
</div>

<script>
const funFacts = [
  "🎤 I'm a Hip-hop fan. My favourite rappers are Kendrick Lamar, Mac Ova Seas, and Asen.",
  "🏀 I'm an NBA fan. Let's go Blazers!",
  "🗣️ I'm a Chinese debater, and used to be the leader of the ECNU School of Communication Debate Team.",
  "💭 I like to talk about society and philosophy. My belief is partly constructed by Foucault and Camus — I think we don't know the meaning of doing something before doing it, but the meaning is created when we are doing it.",
  "📜 I love both traditional and contemporary Chinese poetry. I'd love to talk about Su Shi, Du Fu, Yu Guangzhong, and Yu Xiuhua.",
  "📚 I'm a fiction lover, including serious literature and web literature."
];
let lastFactIndex = -1;
function showRandomFact() {
  let idx;
  do { idx = Math.floor(Math.random() * funFacts.length); } while (idx === lastFactIndex && funFacts.length > 1);
  lastFactIndex = idx;
  const el = document.getElementById('fun-fact-text');
  el.style.opacity = '0';
  setTimeout(() => { el.textContent = funFacts[idx]; el.style.opacity = '1'; }, 200);
}
document.addEventListener('DOMContentLoaded', showRandomFact);
// Fallback in case DOMContentLoaded already fired
if (document.readyState !== 'loading') showRandomFact();
</script>
