export interface DataFlow {
  producer: string
  consumer: string
  contract: string
  label?: string
  dataShape?: string
}

export interface DataFlowDesign {
  participants: string[]
  dataFlows: DataFlow[]
}

export interface Node {
  name: string
  responsibility: string
  exposes: string
  children?: Node[]
  design?: DataFlowDesign
  acceptanceCriteria?: string
  qualityMetrics?: string
  findings?: string
  enhancements?: string
  external?: boolean
}
