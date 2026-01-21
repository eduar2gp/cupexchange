export interface ProductSearchRequestDTO {
  /** The municipality ID of the logged-in user (for 'available' flag logic) */
  userMunicipalityId: number | null;

  /** The province ID of the logged-in user */
  userProvinceId: number | null;

  /** The specific municipality the user is currently browsing */
  selectedMunicipalityId: number | null;

  /** The specific province the user is currently browsing */
  selectedProvinceId: number | null;

  /** Array of Category IDs to filter the results */
  categoryIds: number[];
}
