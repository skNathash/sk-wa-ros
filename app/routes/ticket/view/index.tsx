import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import TicketService from "~/services/TicketService";
import AppHeader from "~/components/core/header/AppHeader";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";

const breadcrumbs = [
  {
    label: "Dashboard",
    redirect: { path: "/dashboard" },
  },
  {
    label: "Ticket Management",
    redirect: { path: "/ticket/list" },
  },
  {
    label: "Ticket Detail",
  },
];

const TicketDetail = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTicket = async () => {
      if (!id) {
        setError("No ticket ID provided");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await TicketService.getTicketList({ id });
        if (res && res.data && res.data.length > 0) {
          setTicket(res.data[0]);
        } else {
          setTicket(null);
        }
      } catch (e) {
        setError("Failed to fetch ticket details");
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [id]);

  return (
    <>
      <AppHeader title="Ticket Detail" />
      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} />
          <div className="tw:mt-4">
            {loading ? (
              <div>Loading...</div>
            ) : error ? (
              <div>{error}</div>
            ) : !ticket ? (
              <div>No data found.</div>
            ) : (
              <div>
                <h2 className="tw-text-lg tw-font-semibold tw-mb-2">
                  Ticket Detail
                </h2>
                <pre className="tw-bg-gray-100 tw-p-4 tw-rounded tw-text-sm tw-overflow-x-auto">
                  {JSON.stringify(ticket, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TicketDetail;
