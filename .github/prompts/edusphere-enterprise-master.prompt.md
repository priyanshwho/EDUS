---
name: "EduSphere Enterprise Master"
description: "Apply the full EduSphere enterprise architecture brief for major implementation tasks"
argument-hint: "Describe the feature or change to implement"
agent: "agent"
---

Use this prompt for architecture-sensitive tasks in this repository.

Required references:
- [Enterprise master brief](../scripts/EDUSPHERE_ENTERPRISE_MASTER_PROMPT.txt)
- [Repository coding instructions](../copilot-instructions.md)

Execution rules:
1. Treat both references as mandatory.
2. If a conflict appears, prioritize the current repository conventions from `copilot-instructions.md`.
3. Preserve strict role permissions and security boundaries.
4. Preserve legacy Google Drive resource compatibility.
5. Never invent missing credentials or environment variables; ask for them.
6. Keep backend and frontend changes modular.

For the current chat request, implement the requested change end-to-end and then report:
- Files changed
- Why each change was needed
- Verification steps and outcomes
