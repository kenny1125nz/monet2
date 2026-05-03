# Designing Maintainable Software with AI: A Recursive Architecture Approach

This document proposes a human-in-the-loop architecture workflow for AI-assisted software development. The goal is not only to ship code faster, but to preserve long-term maintainability, structural clarity, and clear human accountability as systems scale.

Architecture is not an optimization problem with a provable best answer. Every structural boundary reflects a trade-off: speed versus cost, coupling versus autonomy, consistency versus availability, build versus buy. No matter how capable AI becomes, these trade-offs require a values position and a risk appetite that only a human stakeholder can legitimately own. The role of human professionals in software engineering is therefore not to outperform AI on implementation, but to own the decisions that shape what gets built, under what constraints, and at what acceptable risk.

The approach combines recursive decomposition, explicit structural design, and anti-drift feedback loops so that each component remains small enough to reason about, implement, validate, and evolve safely — and so that every structural decision remains traceable to a human who owns it.

## The Problems We're Seeing

Coding agents are reasonably capable these days of producing functioning code. The increased speed of code generation introduces several additional challenges to software engineering.

- **Complexity explosion**: With the speed of AI-generated code, complexity expands exponentially. It is inevitable that software systems will converge to a state in which any change becomes too costly. Without AI, this may take years or decades; with AI, it may take only a few days. There is also the LLM context-window limit: unmanaged complexity can make information needed for further changes exceed that limit. Proper architectural design becomes more important to ensure low coupling between components and to keep complexity around each component manageable for coding agents.
- **Developer fatigue**: Developers interact with agents through chat sessions, and the continuous cycle can easily exhaust them. There are attempts to help developers focus on requirements, design, or planning, and then hand implementation over to coding agents to free developer time. But AI agents often drift from the design, and accumulated drift can lead to chaos.
- **Accountability vacuum**: With AI agents doing most of the hard work, structural decisions accumulate without a clear human owner. At the speed AI can populate code, trade-offs are being made constantly — on boundaries, dependencies, and coupling — with no auditable record of who approved them and why. Accountability without traceable decisions is not accountability.
- **Technical debt**: Every line of code has two sides: the value it introduces and the cost to maintain it. Unmanaged complexity, improper structure, and lack of understanding of the codebase all lead to increased maintenance costs. In this sense, speed is not always a blessing.

## A Naive Idea

Cautious structural design through recursive decomposition, with human involvement, is the answer to these challenges. Decomposition is the first step we adopt when tackling complex tasks; doing it recursively ensures manageable complexity within each component. Decomposition can take many forms, but because our primary goal is to control the growth of complexity, we adopt a strategy that maximizes the self-containment of each component.

The stopping rule for decomposition has two horizons. In the short term, a component should stay within practical limits for implementation and review: it must fit within LLM context-window constraints and within one human's cognitive capacity. In the longer term, the true stopping criterion is structural: the component maps to a clear, single decision boundary that one human can own, explain the trade-offs of, and be accountable for. If no single owner can hold those trade-offs, the component still needs further decomposition.

## Principles Behind It

There are a few key principles and ideas that make this approach possible.

### Pressure-Testing the Idea

Software is merely an idea solidified into code. It usually starts with a vague idea for solving a specific problem. The original idea usually lacks details — both business and technical — that are necessary to shape software properly. Brainstorming through relentless questioning is essential for surfacing those missing details, so that we have a solid foundation before proceeding.

This is also how the first cycle of any new system begins. Any document of intentions — however rough — is sufficient to seed the process. From it, AI and human co-create the root component definition and begin decomposing recursively within the allowed unreviewed depth limit. There is no special bootstrapping ceremony; the first cycle follows the same model as all subsequent ones.

### Designing the Structure

Decomposition involves both breaking systems into smaller sub-components and defining how those sub-components coordinate and interact. This is what I call structural design, and AI agents can produce strong candidates for it. But human involvement is mandatory, not because AI cannot generate a good design, but because every structural boundary encodes a trade-off — and trade-offs require a human to declare the risk appetite, choose among options, and be accountable for the consequences. AI presents; the human professional decides and owns.

It is also important to measure design quality in terms of how well it manages complexity. This can be used as a key indicator for AI agents to optimize design.

Decomposition should also maximize leaf-node reusability: low coupling, low internal dependencies, and low interface constraints. Middle-layer design changes will often alter orchestration, while many leaf capabilities remain valuable. During revision, AI should redesign only impacted child components and reuse existing leaf capabilities whenever possible.

Vertical decomposition — cutting through all technology layers rather than splitting by them — is a useful heuristic because it tends to produce components with clear, ownable boundaries. A leaf component that owns its full slice of the stack is easier to assign to one owner and easier to reason about as a complete trade-off unit. Horizontal cuts by technology layer tend to produce shared components where no one person can fully own the trade-offs, making accountability diffuse. Treat vertical slicing as the preferred default, not a dogma: the real test is whether each component has a clear owner and a coherent set of trade-offs.

### Human Review at Decision Boundaries

AI can propose decomposition and proceed autonomously through implementation, but only up to a depth limit relative to the last human-reviewed layer. The reason is not primarily fatigue management — it is decision traceability. Each layer of decomposition introduces new structural trade-offs. If AI proceeds too many layers without human review, decisions accumulate without an owner, and redesign cost grows silently.

The operating model is:
- AI proposes decomposition and can proceed to deeper decomposition before review
- Human reviews decomposition in batches, confirming trade-off decisions at each reviewed layer
- AI cannot proceed more than two layers below the last human-reviewed layer

This bounds the number of unowned structural decisions at any point in time, not just the cost of redesign.

### Keeping Code Aligned with Design

"Designs" are usually delivered as documents or graphs, which do not enforce hard constraints on implementation. Deviation between implementation and design is common, even without AI. With AI's speed, this deviation can be magnified. We need to introduce a data model that represents the design, and also an analyzer (ideally AST-based) that interprets code implementation in the same data model so deviations are observable and measurable.

The analyzer should be a standalone capability that users can run at any time against any target. Within the development lifecycle, one analyzer run should be mandatory at the end of implementation and before review, so drift findings become structured review input.

It is important to be clear about what the design model is and is not: code is the truth; the design model is the intention. Drift is an observed fact, not a violation. The tool does not enforce conformance; it makes divergence visible. If the cost of keeping the design model current outweighs its value for a given project or owner, they should stop using the tool. A tool that becomes a burden has failed its purpose.

### Making Components Self-Contained

Because each component must be ownable by one human, every aspect of that component — intention, trade-off decisions, design, and code — must be co-located and visible together. We need a folder structure in which all of these sit together in the project, so each folder contains everything needed for the component it represents: not just to run it, but to understand its decisions. Subfolders naturally represent the decomposition's parent-child relationship, and by extension the chain of owned decisions from system root to leaf.

### Scaffolding as a First-Class Capability

To anchor the design before implementation begins to drift, this project should include a built-in scaffolding capability. The scaffolding step should read structured design input and generate the initial folder structure plus component data model files as the design baseline.

This takes the form of a two-step flow backed by git:
- **Step A: Scaffolding baseline**: Generate folder structure and data model files from design input, then commit this baseline before logic work starts.
- **Step B: Logic implementation**: Coding agents implement logic and tests. Any edits to generated design artifacts should remain uncommitted (optionally staged) and be highlighted during review.

## What We Mean by a Component

There are universal aspects of a component that we want to model and manage to make the overall approach viable.

### System-Level Criteria

Beyond individual components, the system as a whole should also be defined with explicit acceptance criteria, quality measurements, and performance expectations. When component-level criteria conflict with system-level goals, system-level criteria take precedence.

Any such conflict signals a design failure: either constraints were not properly propagated downward, or component boundaries need revision. Such conflicts trigger redesign review, not local tuning.

### Component Identity and Boundaries

Before design and implementation details, each component should be defined by a clear identity and boundary. A component is not just a folder of code; it is a unit of responsibility with a contract, ownership, and measurable outcomes.

A component should explicitly define:
- **Single responsibility**: the one problem it exists to solve
- **Boundary**: what is inside the component and what is outside
- **Contract**: what it expects as input and guarantees as output
- **Dependencies**: what it relies on (internal and external); widely shared components that serve many other components should be tagged as shared infrastructure and treated as external dependencies rather than owned sub-components
- **Ownership**: who is accountable for design quality and maintenance
- **Observability**: how behavior and quality are measured over time
- **Atomicity threshold**: whether the component still maps to a single, ownable decision boundary — one human can understand its trade-offs, approve its design, and be accountable for its outcomes in one review cycle

### Design Phase

The following aspects of a component should be covered and modeled:
- Responsibility
- Input (schema or brief)
- Output (schema or brief)
- Acceptance Criteria
- Quality Measurements
- Tools (internal or external dependencies to support the component)
- The Design (decomposition in a modeled data structure that covers child components, roughly defined, and how they interact)

Before implementation can begin, the design must pass a mandatory validation checkpoint. The checkpoint confirms that all aspects above are complete, decomposition remains within review-cleared depth limits, and scaffolding inputs are deterministic enough to generate consistent structure and data model files.

This gate has no urgency bypass: the workflow is intentionally lightweight so it remains usable under pressure. If teams cannot use it during urgent work, the framework should be redesigned rather than bypassed. Human decisions about structural impact remain outside tool scope. The tool's role is to assess and measure drift, then present structured information for review.

### Implementation Phase

During implementation, the phase is split into two activities:
- **Scaffolding baseline**: Generate structure and design data model files from the approved decomposition, then commit.
- **Logic implementation**: Add functional code, tests based on acceptance criteria, and benchmark code based on quality measurements.

In addition to becoming part of the component, the above artefacts should be accompanied by an implementation report as a key output of the implementation cycle. It should cover:
- **Basic metrics**: lines of code, file count, token usage, and time spent
- **Structural analysis** based on code (assuming an AST-based tool is available), in a structured format
- **Testing results**: test coverage report (using any existing library or tool)
- **Quality report**: produced by benchmark code
- **Design adjustments**: when the design is challenged or adjusted during implementation, the coding agent should document what changed, which components were impacted, what existing capabilities were reused, what was discarded, and why.

### Review and Iteration

With the implemented component and the implementation report, humans (assisted by AI) can review the implementation and identify:
- **Findings** for rework (back to implementation phase in the same cycle)
- **Enhancements** for the next design and implementation cycle

The mandatory output of every review cycle is a decision record: a structured, git-committed log of every structural trade-off that was made, who approved it, and why. This is the primary accountability artefact of the framework. Drift reports, test results, and implementation reports are inputs to that decision. The decision record is the output.

Human judgment remains fully outside tool scope. The tool assesses and measures design-implementation drift, then presents structured drift information as input to the human reviewer.

Drift observations and any design adjustments made during implementation feed into review as structured input. Each item must be triaged by the human owner as:
- **Accepted**: trade-off is justified; rationale recorded in git history as a decision record before the cycle closes
- **Revised**: sent back to implementation or design for correction (becomes a finding)
- **Deferred**: logged as a known gap for the next cycle (becomes an enhancement); repeated deferrals may signal the component is approaching sunset

### Component Lifecycle and System Health

Over time, the pattern of enhancements, deferred decisions, and adjustments reveal component and system health.

With cautious design throughout the lifecycle, each enhancement should be small and implementable at a fast pace with AI assistance. There is no need to classify enhancements upfront into debt versus opportunity categories: the cost of the enhancement is the signal.

When an enhancement becomes large and costly, that is a natural indicator that the target component or system is heading toward sunset. At that point, human judgment must assess the ROI. If the decision is "No Go," the item is recorded in a "Not Possible" decision log rather than kept as an open enhancement.

A growing "Not Possible" pile is a system health indicator. It signals that the system is losing its capacity to absorb change and that planned reinvestment or retirement should be considered. This replaces bureaucratic decay detection with observable, data-driven signals.

### Ownership and Accountability

Every structural boundary in a software system encodes a trade-off. Ownership means owning those trade-offs: the decisions about where to draw boundaries, what risks to accept, what constraints to impose, and what to defer. This is what makes accountability real rather than nominal. A human who cannot explain the trade-offs of a component they own does not actually own it.

Accountability is anchored by one human owner for the overall system. Delegation models are intentionally out of scope for this vision.

Within decomposition, ownership is recursive: each component must have an explicit human owner who can articulate its key trade-offs. If ownership cannot be assigned at a boundary, that boundary should be treated as a contract interface to an external dependency rather than an owned sub-component.

## Open Questions and Next Step

To keep this as a useful concept rather than a rigid framework, we should make the uncertainties explicit and test the idea in a small, real workflow.

Open questions:
- Which quality measurements are mandatory across all components, and which are domain-specific?
- How should design-implementation drift be scored so it is actionable instead of noisy?
- What is the best batch size for human decomposition review before fatigue rises again?
- How should reusable leaf capabilities be indexed and retrieved during redesign?
- How should decision logs and "Not Possible" piles be maintained and queried across system lifetime?

Suggested next step:
- Run one pilot on a medium-sized feature using this component model end-to-end. Measure cycle time, defect rate, drift score, rework rate, leaf-node reuse rate, and human fatigue indicators. Pay special attention to whether the framework is used voluntarily by reviewers after the pilot.
