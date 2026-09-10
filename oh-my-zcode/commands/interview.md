---
description: Run an interview Q&A session that iteratively generates a structured 11-section specification document
argument-hint: <idea or existing spec basename>
---

You are running an interview q&a session for the user inside their repository.

Initial idea: $ARGUMENTS

Goal: Iteratively generate and populate a highly structured Specification document, saved to `interview/<title>.md` in the project (create the `interview/` directory if it does not exist; if $ARGUMENTS names an existing spec file under `interview/`, resume from that document instead of starting over).

Your target document MUST be structured strictly using the following 11-section template:

# Introduction
[Short intro to the spec and goals]

## 1. Purpose & Scope
[Intended audience, boundaries, and assumptions]

## 2. Definitions
[Acronyms, terms defined]

## 3. Requirements, Constraints & Guidelines
[Explicitly list requirements using:
- **REQ-001**: Description
- **SEC-001**: Security constraints
- **CON-001**: System constraints/technologies
- **GUD-001**: Guidelines]

## 4. Interfaces & Data Contracts
[APIs, JSON schemas, protocol buffers, or class/data structures]

## 5. Acceptance Criteria
[Define testable criteria in Given-When-Then format:
- **AC-001**: Given [context], When [action], Then [expected outcome]]

## 6. Test Automation Strategy
[Mocking approach, test framework, unit/integration details]

## 7. Rationale & Context
[Trade-offs and architectural decisions]

## 8. Dependencies & External Integrations
[Conceptual integrations or external dependencies:
- **EXT-001**: Dependency details]

## 9. Examples & Edge Cases
[Concrete code examples, settings, or JSON structures]

## 10. Validation Criteria
[Testing or validation check logic]

## 11. Related Specifications / Further Reading
[Internal doc references]

ANTI-ASSUMPTION & SUBAGENT DELEGATION RULE:
Do not invent file structures, API signatures, package lists, or library behaviors. If you need to trace local code, verify file paths, or check configurations, you MUST delegate discovery to the Explore subagent or search files directly. If you need to search documentation or web info for external APIs/libraries, you MUST delegate to the librarian subagent or search the web. Do not guess. Pause, run discovery, and integrate facts into the spec.

Clarify the idea through short rounds of at most 2 questions at a time.
When useful, each question may include 2 to 4 answer options and one suggested option.
Be practical. Focus on the highest-ambiguity and highest-risk decisions first.

After each round, update the specification document at `interview/<title>.md` with the Write tool so the user can review it at any time (the title comes from the `title` field below; keep it stable once chosen).

Ask the questions in your reply text (numbered, with options and a suggested option), and wait for the user's answers before the next round.

Rules:
- Return 0 to 2 questions per round.
- If there are no more useful questions or the specification is complete, return zero questions, finalize the document, and summarize completion to the user.
- Do not ask more than 2 questions in one round.
- Choose a concise kebab-case title (3-6 words) suitable for a filename.
