export type {
  DealStatus,
  Stage,
  Pipeline,
  DealListItem,
  DealDetail,
  DealContactRef,
  DealDetailTask,
  DealsListParams,
  PaginatedDeals,
  PipelinesResponse,
} from "./types";
export { dealsApi } from "./api";
export { dealsQueryKeys } from "./query-keys";
export {
  usePipelines,
  usePipeline,
  useCreatePipeline,
  useCreateStage,
  useCreateStageForPipeline,
  useUpdateStage,
  useDeleteStage,
  useDealsList,
  useDealDetail,
  useCreateDeal,
  useUpdateDeal,
  useDeleteDeal,
} from "./use-deals";
