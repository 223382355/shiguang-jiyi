# IGA Pages Skills

Official Agent Skills for deploying projects on [Volcengine IGA Pages](https://www.volcengine.com/docs/6559/2188992?lang=zh).

## Typical Triggers

This skill is suitable for prompts such as:

- `Deploy to IGA Pages`
- `deploy my app`
- `publish this site`

## Installation

### Option 1: Natural Language Installation

Enter the repository URL in your AI chat, for example:

> Install this skill: https://github.com/volc-iga-pages/iga-pages-skills

### Option 2: Command Line Installation

If your current tool supports installation by repository identifier, use:

```bash
npx skills add volc-iga-pages/iga-pages-skills
```

### Option 3: Manual Installation

Copy the `skills/iga-pages/` directory into the Skills directory for your tool:

| Tool        | Skills Directory     |
| ----------- | -------------------- |
| TRAE        | `~/.trae/skills/`    |
| TRAE CN     | `~/.trae-cn/skills/` |
| Claude Code | `~/.claude/skills/`  |
| Cursor      | `~/.cursor/skills/`  |

## Prerequisites

- Node.js `>= 20`
- `@iga-pages/cli` is installed or can be installed
- A Volcengine account is available, with AK/SK login when needed

## License

This project is licensed under the [MIT License](./LICENSE). When running, it calls Volcengine APIs and related platform services. To use these APIs and services, you must comply with the following agreements and privacy policies where applicable:

- https://www.volcengine.com/docs/6559/93535?lang=zh
- https://www.volcengine.com/docs/6737/133344?lang=zh
