# Simplify Skill

Behavior-preserving code simplification and readability-focused refactoring.

## Overview

This bundled skill helps the main Agent simplify code without changing
behavior. It focuses on readability, maintainability, and reducing unnecessary
complexity. The `oracle` subagent cannot load it (its `tools` list has no
`Skill`), so when oracle recommends simplification, the main Agent applies the
skill to the change.

## Source

Adapted from Addy Osmani's
[`code-simplification` skill](https://github.com/addyosmani/agent-skills/blob/main/skills/code-simplification/SKILL.md).

## Installation

Bundled with `oh-my-zcode` and enabled automatically when the plugin is
installed from the marketplace.
