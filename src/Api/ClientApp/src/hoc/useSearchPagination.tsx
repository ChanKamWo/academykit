import SearchBar from "@components/Ui/SearchBar";
import { Pagination, Select, UnstyledButton } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import queryStringGenerator from "@utils/queryStringGenerator";
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { IconChevronDown, IconChevronUp, IconArrowsSort } from "@tabler/icons";
import moment from "moment";

export interface IWithSearchPagination {
  searchParams: string;

  pagination: (totalPage: number, length: number) => JSX.Element;
  searchComponent: (placeholder?: string) => JSX.Element;
  sortComponent: (props: { title: string; sortKey: string }) => JSX.Element;
  filterComponent: (
    data: {
      value: string;
      label: string;
    }[],
    placeholder: string,
    key: string
  ) => JSX.Element;
  setInitialSearch: React.Dispatch<
    React.SetStateAction<
      {
        key: string;
        value: string;
      }[]
    >
  >;
  startDateFilterComponent: (
    placeholder: string,
    key: string,
    label?: string
  ) => JSX.Element;
  endDateFilterComponent: (
    placeholder: string,
    key: string,
    label?: string
  ) => JSX.Element;
}

const withSearchPagination =
  <P extends object>(Component: React.FC<P & IWithSearchPagination>) =>
  (props: P) => {
    const [params, setParams] = useSearchParams();
    const [sort, setSort] = useState(params.get("so") ?? "");
    const [filterKey, setFilterKey] = useState<string>("");
    const [initialSearch, setInitialSearch] = useState<
      {
        key: string;
        value: string;
      }[]
    >([
      {
        key: "",
        value: "",
      },
    ]);

    let search = params.get("s") ?? null;
    let pageSize = 12;
    const [itemLength, setItemLength] = useState<number>();
    const [filterValue, setFilterValue] = useState<string>("");
    const [currentPage, setCurrentPage] = useState(
      parseInt(params.get("p") ?? "1")
    );
    const [startDate, setStartDate] = useState<string>("");
    const [startDateKey, setStartDateKey] = useState<string>("");

    const [endDate, setEndDate] = useState<string>("");
    const [endDateKey, setEndDateKey] = useState<string>("");
    console.log("start", startDate)
    console.log("end", endDate)

    useEffect(() => {
      if (currentPage !== 1 && itemLength == 0) {
        setPage(currentPage - 1);
      }
    }, [itemLength]);
    const qs = useMemo(() => {
      const [by, type] = sort.split(":");
      const initSearchObject: Record<string, string> = {};
      initialSearch.forEach((x) => {
        initSearchObject[x.key] = x.value;
      });

      const qs = queryStringGenerator({
        ...initSearchObject,
        search,
        page: currentPage,
        size: pageSize,
        sortBy: by,
        sortType: type,
        [filterKey]: filterValue,
        [startDateKey]: startDate,
        [endDateKey]: endDate,
      });

      !!search && params.set("s", search);
      sort && params.set("so", sort);

      pageSize && params.set("si", pageSize?.toString());
      currentPage && params.set("p", currentPage.toString());

      setParams(params, { replace: true });
      return qs;
    }, [
      currentPage,
      search,
      pageSize,
      sort,
      filterValue,
      initialSearch,
      startDateKey,
      endDateKey
    ]);

    const setSearch = (search: string) => {
      for (let value of params.entries()) {
        if (value[0] !== "s") params.delete(value[0]);
      }
      params.set("s", search);
      setParams(params);
    };

    const sortComponent = (props: { title: string; sortKey: string }) => {
      const sortKey = sort && sort.split(":").length > 0 && sort.split(":")[0];
      const sortValue =
        sort && sort.split(":").length > 0 && sort.split(":")[1];
      const isAscending = sortKey === props.sortKey && sortValue === "1";

      return (
        <UnstyledButton
          style={{
            display: "flex",
            alignItems: "center",
            fontWeight: "bold",
            color: "#495057",
            fontSize: "inherit",
          }}
          onClick={() => {
            setSort(() => props.sortKey + `:${!isAscending ? "1" : "0"}`);
          }}
        >
          {props.title}

          {props.sortKey === sortKey ? (
            isAscending ? (
              <IconChevronUp style={{ marginLeft: "10px" }} size={20} />
            ) : (
              <IconChevronDown style={{ marginLeft: "10px" }} size={20} />
            )
          ) : (
            <IconArrowsSort style={{ marginLeft: "10px" }} size={20} />
          )}
        </UnstyledButton>
      );
    };

    const filterComponent = (
      data: { value: string; label: string }[],
      placeholder: string,
      key: string
    ) => {
      return (
        <Select
          placeholder={placeholder}
          ml={5}
          clearable
          maw={"184px"}
          value={filterValue}
          data={data}
          onChange={(e: string) => {
            setFilterValue(() => e);
            setFilterKey(() => key);
          }}
        />
      );
    };

    const setPage = (pageNumber: number) => {
      setCurrentPage(pageNumber);
    };

    const pagination = (totalPage: number, length: number) => {
      setItemLength(length);
      return totalPage > 1 ? (
        <Pagination
          my={20}
          total={totalPage}
          value={currentPage}
          onChange={setPage}
        />
      ) : (
        <></>
      );
    };
    const searchComponent = (placeholder?: string) => (
      <SearchBar
        search={search ?? ""}
        setSearch={setSearch}
        placeholder={placeholder}
      />
    );

    const startDateFilterComponent = (
      placeholder: string,
      key: string,
      label?: string
    ) => {
      return (
        <DatePickerInput
          clearable
          valueFormat="YYYY MMM DD"
          label={label}
          placeholder={placeholder}
          onChange={(val: any) => {
            setStartDate(moment(val).toISOString());
            setStartDateKey(key);
          }}
          miw={122}
          mr={5}
        />
      );
    };

    const endDateFilterComponent = (
      placeholder: string,
      key: string,
      label?: string
    ) => {
      return (
        <DatePickerInput
          clearable
          valueFormat="YYYY MMM DD"
          label={label}
          placeholder={placeholder}
          onChange={(val: any) => {
            setEndDate(moment(val).toISOString());
            setEndDateKey(key);
          }}
          miw={122}
          mr={5}
        />
      );
    };

    return (
      <Component
        {...(props as P)}
        filterComponent={filterComponent}
        searchParams={qs}
        pagination={pagination}
        searchComponent={searchComponent}
        sortComponent={sortComponent}
        setInitialSearch={setInitialSearch}
        startDateFilterComponent={startDateFilterComponent}
        endDateFilterComponent={endDateFilterComponent}
      />
    );
  };

export default withSearchPagination;
