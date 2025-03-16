declare function mcp_Neon_NEON_INITIATE_CONNECTION(params: {
  params: {
    tool: string;
  };
}): Promise<{
  connection_status: string;
  connection_id: string;
  error?: string;
  successful: boolean;
}>;

declare function mcp_Neon_NEON_RETRIEVE_PROJECTS_LIST(params: {
  params: {
    cursor?: string;
    limit?: number;
    org_id?: string;
    search?: string;
    timeout?: number;
  };
}): Promise<{
  projects: any[];
  error?: string;
  successful: boolean;
}>;

declare function mcp_Neon_NEON_GET_PROJECT_CONNECTION_URI(params: {
  params: {
    project_id: string;
    database_name: string;
    role_name: string;
    branch_id?: string;
    endpoint_id?: string;
    pooled?: boolean;
  };
}): Promise<{
  connection_uri: string;
  error?: string;
  successful: boolean;
}>;

declare function mcp_Neon_NEON_FETCH_VPCENDPOINT_DETAILS_BY_ID(params: {
  params: {
    org_id: string;
    region_id: string;
    vpc_endpoint_id: string;
  };
}): Promise<{
  vpc_endpoint: any;
  error?: string;
  successful: boolean;
}>;

declare function mcp_Neon_NEON_RETRIEVE_ALL_REGIONS(params: {
  params: {};
}): Promise<{
  regions: any[];
  error?: string;
  successful: boolean;
}>;

declare function mcp_Neon_NEON_CREATE_VPC_ENDPOINT_WITH_LABEL(params: {
  params: {
    org_id: string;
    region_id: string;
    vpc_endpoint_id: string;
    label: string;
  };
}): Promise<{
  vpc_endpoint: any;
  error?: string;
  successful: boolean;
}>;

declare function mcp_Neon_NEON_CREATE_VPC_ENDPOINT_LABEL(params: {
  params: {
    project_id: string;
    vpc_endpoint_id: string;
    label: string;
  };
}): Promise<{
  vpc_endpoint: any;
  error?: string;
  successful: boolean;
}>;

declare function mcp_Neon_NEON_GET_CURRENT_USER_INFORMATION(params: {
  params: {};
}): Promise<{
  user: any;
  error?: string;
  successful: boolean;
}>;

declare function mcp_Neon_NEON_RETRIEVE_ORGANIZATION_BY_ID(params: {
  params: {
    org_id: string;
  };
}): Promise<{
  organization: any;
  error?: string;
  successful: boolean;
}>;

declare function mcp_Neon_NEON_TRANSFER_USER_PROJECTS_TO_ORGANIZATION(params: {
  params: {
    org_id: string;
    project_ids: string[];
  };
}): Promise<{
  success: boolean;
  error?: string;
  successful: boolean;
}>;

declare function mcp_Neon_NEON_GET_BRANCHES_FOR_PROJECT(params: {
  params: {
    project_id: string;
    search?: string;
  };
}): Promise<{
  branches: any[];
  error?: string;
  successful: boolean;
}>;

declare function mcp_Neon_NEON_GET_REQUIRED_PARAMETERS(params: {
  params: {
    tool: string;
  };
}): Promise<{
  parameters: any[];
  error?: string;
  successful: boolean;
}>;

declare function mcp_Neon_NEON_CHECK_ACTIVE_CONNECTION(params: {
  params: {
    tool: string;
    connection_id?: string;
  };
}): Promise<{
  active: boolean;
  error?: string;
  successful: boolean;
}>; 