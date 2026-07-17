import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppBadge from "~/components/core/badge/AppBadge";
import { AppTable, TableHeader } from "~/components/core/table";
import { CustomerService } from "~/services/CustomerService";
import type { PaginationState, TableHeaderItem } from "~/types/CommonTypes";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";

type Props = {
  customerId: string;
};

const containerStyle = {
  maxHeight: "calc(100vh - 450px)",
};

const CallCustomerLogs = ({ customerId }: Props) => {
  const { register, setValue, getValues } = useForm();

  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [hasMoreData, setHasMoreData] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    endSlNo: 10,
    startSlNo: 1,
    totalRecords: 0,
  });

  useEffect(() => {
    setValue("cid", customerId);
    applyFilter();
  }, []);

  const applyFilter = async () => {
    setLoading(true);
    const params = prepareFilterParams(getValues(), paginationRef.current);
    const res = await getData(params);

    const countRes = await getCount(params);
    paginationRef.current.totalRecords = countRes.count;

    setLogs(res.data);
    setHasMoreData(res.data.length >= paginationRef.current.rowsPerPage);
    setLoading(false);
  };

  const loadMore = async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: paginationRef.current.activePage + 1,
    };
    setLoadingMore(true);
    const params = prepareFilterParams(getValues(), paginationRef.current);
    const res = await getData(params);
    setLogs([...logs, ...res.data]);
    setHasMoreData(res.data.length >= paginationRef.current.rowsPerPage);
    setLoadingMore(false);
  };

  const handlePlay = (id: string) => {
    const audioElement = audioRefs.current[id];

    if (playingAudioId && playingAudioId !== id) {
      const prevAudio = audioRefs.current[playingAudioId];
      if (prevAudio) {
        prevAudio.pause();
        prevAudio.currentTime = 0;
      }
    }

    if (audioElement) {
      if (playingAudioId === id) {
        audioElement.pause();
        audioElement.currentTime = 0;
        setPlayingAudioId(null);
      } else {
        audioElement.play();
        setPlayingAudioId(id);
      }
    }
  };

  return (
    <>
      <PaginationSummary
        paginationConfig={paginationRef.current}
        loadingTotalRecords={loading}
        fwSize="sm"
        className="tw:mb-2"
        loadedCount={logs.length}
      />
      <AppTable
        size="sm"
        responsive
        container
        fixedLayout
        condensed
        containerStyle={containerStyle}
        stickyHeader
      >
        <AppTable.Header>
          <TableHeader headers={headers} />
        </AppTable.Header>
        <AppTable.Body>
          {logs.map((log) => (
            <AppTable.Row>
              <AppTable.Cell>
                <DateFormat value={log.createdAt} formatStr="dd MMM yyyy" />
              </AppTable.Cell>
              <AppTable.Cell>
                <DateFormat value={log.createdAt} formatStr="hh:mm a" />
              </AppTable.Cell>
              <AppTable.Cell>
                <AppBadge
                  variant={log.status === "Success" ? "success" : "danger"}
                >
                  {log.status}
                </AppBadge>
              </AppTable.Cell>
              <AppTable.Cell>
                {log.audioUrl ? (
                  <>
                    <button
                      className={`btn ${
                        playingAudioId === log._id
                          ? "btn-primary"
                          : "btn-outline-secondary"
                      } rounded-circle btn-sm m-0`}
                      onClick={() => handlePlay(log._id)}
                    >
                      <i
                        className={`bi bi-${
                          playingAudioId === log._id
                            ? "pause-fill"
                            : "play-fill"
                        }`}
                      ></i>
                    </button>

                    <audio
                      ref={(element) => {
                        if (element) {
                          audioRefs.current[log._id] = element;
                        }
                      }}
                      className="d-none"
                    >
                      <source src={log.audioUrl} type="audio/mpeg" />
                    </audio>
                  </>
                ) : (
                  "--"
                )}
              </AppTable.Cell>
            </AppTable.Row>
          ))}
        </AppTable.Body>
      </AppTable>
      {hasMoreData && !loading && (
        <div className="tw:text-center tw:mt-4">
          <AppButton
            onClick={loadMore}
            disabled={loadingMore}
            size="small"
            color="light"
            fill="outline"
          >
            {loadingMore ? "Loading..." : "Load More"}
          </AppButton>
        </div>
      )}
    </>
  );
};

const headers: TableHeaderItem[] = [
  {
    label: "Date",
    key: "createdAt",
  },
  {
    label: "Time",
    key: "createdAt",
  },
  {
    label: "Status",
  },
  {
    label: "Audio",
    key: "audioUrl",
  },
];

const getData = async (params: Record<string, any>) => {
  const r = await CustomerService.getCallLogs(params);
  const d = Array.isArray(r.data) ? r.data : [];
  return { data: d };
};

const getCount = async (params: Record<string, any>) => {
  let p = { ...params };
  delete p.page;
  delete p.count;

  const r = await CustomerService.getCallLogsCount(p);
  return { count: r.count };
};

const prepareFilterParams = (
  filter: Record<string, any>,
  pagination: PaginationState
) => {
  let p = {
    page: pagination?.activePage,
    count: pagination?.rowsPerPage,
    filter: {
      // "customerInfo.id": filter.cid,
      type: "VoiceCall",
    },
    sort: "-createdAt",
  };
  return p;
};

export default CallCustomerLogs;
