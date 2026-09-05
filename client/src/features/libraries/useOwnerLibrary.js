import { useGetLibrariesQuery } from '../../app/api';

export function useOwnerLibrary() {
  const { data, isLoading, error } = useGetLibrariesQuery();
  const libraries = data?.data ?? [];
  const library = libraries[0] ?? null;
  return { library, libraries, isLoading, error };
}
