import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api/v1',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Library', 'Floor', 'Facility', 'AdminLibrary', 'AdminOverview', 'AdminCustomer', 'Order'],
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    register: builder.mutation({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    getLibraries: builder.query({
      query: () => '/libraries',
      providesTags: ['Library'],
    }),
    createLibrary: builder.mutation({
      query: (body) => ({ url: '/libraries', method: 'POST', body }),
      invalidatesTags: ['Library'],
    }),
    updateLibrary: builder.mutation({
      query: ({ libraryId, ...body }) => ({
        url: `/libraries/${libraryId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Library'],
    }),
    getFloors: builder.query({
      query: (libraryId) => `/libraries/${libraryId}/floors`,
      providesTags: ['Floor'],
    }),
    createFloor: builder.mutation({
      query: ({ libraryId, ...body }) => ({
        url: `/libraries/${libraryId}/floors`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Floor'],
    }),
    updateFloor: builder.mutation({
      query: ({ libraryId, floorId, ...body }) => ({
        url: `/libraries/${libraryId}/floors/${floorId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Floor'],
    }),
    deleteFloor: builder.mutation({
      query: ({ libraryId, floorId }) => ({
        url: `/libraries/${libraryId}/floors/${floorId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Floor'],
    }),
    getFacilities: builder.query({
      query: () => '/facilities',
      providesTags: ['Facility'],
    }),
    getCommonFacilities: builder.query({
      query: (libraryId) => `/libraries/${libraryId}/facilities`,
      providesTags: ['Library'],
    }),
    setCommonFacilities: builder.mutation({
      query: ({ libraryId, facilities }) => ({
        url: `/libraries/${libraryId}/facilities`,
        method: 'PUT',
        body: { facilities },
      }),
      invalidatesTags: ['Library'],
    }),
    getPublicLibraries: builder.query({
      query: (params) => ({ url: '/public/libraries', params }),
    }),
    getPublicLibrary: builder.query({
      query: (slug) => `/public/libraries/${slug}`,
    }),
    getPublicLibraryFloors: builder.query({
      query: (slug) => `/public/libraries/${slug}/floors`,
    }),
    getMyOrders: builder.query({
      query: () => '/customers/me/orders',
      providesTags: ['Order'],
    }),
    getAdminOverview: builder.query({
      query: () => '/admin/overview',
      providesTags: ['AdminOverview'],
    }),
    getAdminLibraries: builder.query({
      query: (status) => ({ url: '/admin/libraries', params: status ? { status } : undefined }),
      providesTags: ['AdminLibrary'],
    }),
    getAdminLibrary: builder.query({
      query: (libraryId) => `/admin/libraries/${libraryId}`,
      providesTags: ['AdminLibrary'],
    }),
    updateAdminLibraryStatus: builder.mutation({
      query: ({ libraryId, status }) => ({
        url: `/admin/libraries/${libraryId}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['AdminLibrary', 'AdminOverview'],
    }),
    bulkImportLibraries: builder.mutation({
      query: (libraries) => ({
        url: '/admin/libraries/bulk-import',
        method: 'POST',
        body: { libraries },
      }),
      invalidatesTags: ['AdminLibrary', 'AdminOverview'],
    }),
    getAdminCustomers: builder.query({
      query: () => '/admin/customers',
      providesTags: ['AdminCustomer'],
    }),
    getOrders: builder.query({
      query: (libraryId) => `/libraries/${libraryId}/orders`,
      providesTags: ['Order'],
    }),
    createOrder: builder.mutation({
      query: ({ libraryId, ...body }) => ({
        url: `/libraries/${libraryId}/orders`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Order', 'Floor'],
    }),
    approveOrder: builder.mutation({
      query: ({ libraryId, orderId }) => ({
        url: `/libraries/${libraryId}/orders/${orderId}/approve`,
        method: 'PUT',
      }),
      invalidatesTags: ['Order', 'Floor'],
    }),
    rejectOrder: builder.mutation({
      query: ({ libraryId, orderId }) => ({
        url: `/libraries/${libraryId}/orders/${orderId}/reject`,
        method: 'PUT',
      }),
      invalidatesTags: ['Order'],
    }),
    renewOrder: builder.mutation({
      query: ({ libraryId, orderId, ...body }) => ({
        url: `/libraries/${libraryId}/orders/${orderId}/renew`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Order', 'Floor'],
    }),
    cancelOrder: builder.mutation({
      query: ({ libraryId, orderId }) => ({
        url: `/libraries/${libraryId}/orders/${orderId}/cancel`,
        method: 'PUT',
      }),
      invalidatesTags: ['Order', 'Floor'],
    }),
    markOrderPaid: builder.mutation({
      query: ({ libraryId, orderId }) => ({
        url: `/libraries/${libraryId}/orders/${orderId}/mark-paid`,
        method: 'PUT',
      }),
      invalidatesTags: ['Order'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetLibrariesQuery,
  useCreateLibraryMutation,
  useUpdateLibraryMutation,
  useGetFloorsQuery,
  useCreateFloorMutation,
  useUpdateFloorMutation,
  useDeleteFloorMutation,
  useGetFacilitiesQuery,
  useGetCommonFacilitiesQuery,
  useSetCommonFacilitiesMutation,
  useGetPublicLibrariesQuery,
  useGetPublicLibraryQuery,
  useGetPublicLibraryFloorsQuery,
  useGetMyOrdersQuery,
  useGetAdminOverviewQuery,
  useGetAdminLibrariesQuery,
  useGetAdminLibraryQuery,
  useUpdateAdminLibraryStatusMutation,
  useBulkImportLibrariesMutation,
  useGetAdminCustomersQuery,
  useGetOrdersQuery,
  useCreateOrderMutation,
  useApproveOrderMutation,
  useRejectOrderMutation,
  useRenewOrderMutation,
  useCancelOrderMutation,
  useMarkOrderPaidMutation,
} = api;
