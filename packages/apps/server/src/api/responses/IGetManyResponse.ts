export default interface IGetManyResponse<RecordType> {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  records: RecordType[];
}
