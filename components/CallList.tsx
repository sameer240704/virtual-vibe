"use client";
import { useGetCalls } from "@/hooks/useGetCalls";
import { Call, CallRecording } from "@stream-io/video-react-sdk";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import MeetingCard from "./MeetingCard";
import Loader from "./Loader";
import { useToast } from "./ui/use-toast";

const CallList = ({ type }: { type: "ended" | "upcoming" | "recordings" }) => {
  const { endedCalls, upcomingCalls, callRecordings, isLoading } =
    useGetCalls();
  const [recordings, setRecordings] = useState<CallRecording[]>([]);

  const router = useRouter();

  const { toast } = useToast();

  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        const callData = await Promise.all(
          callRecordings?.map((meeting) => meeting.queryRecordings())
        );

        console.log(callData);

        const recordings = callData
          .filter((call) => call.recordings.length > 0)
          .flatMap((call) => call.recordings);

        setRecordings(recordings);
      } catch (error) {
        console.log(`Recordings Error: ${error}`);
        toast({
          title: "Cannot fetch the recordings",
          description: "Too many requests on Stream server",
        });
      }
    };

    if (type === "recordings") fetchRecordings();
  }, [type, callRecordings]);

  if (isLoading) return <Loader />;

  const getCalls = () => {
    switch (type) {
      case "ended":
        return endedCalls;
      case "upcoming":
        return upcomingCalls;
      case "recordings":
        return recordings;
      default:
        return [];
    }
  };

  const getCallsFalse = () => {
    switch (type) {
      case "ended":
        return "No previous meetings";
      case "upcoming":
        return "No upcoming meetings";
      case "recordings":
        return "No recordings";
      default:
        return "";
    }
  };

  const calls = getCalls();
  const callsFalse = getCallsFalse();

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {calls && calls.length > 0 ? (
        calls.map((meeting: Call | CallRecording) => (
          <MeetingCard
            key={(meeting as Call).id}
            icon={
              type === "ended"
                ? "/icons/previous.svg"
                : type === "upcoming"
                ? "/icons/upcoming.svg"
                : "/icons/recordings.svg"
            }
            title={
              (meeting as Call).state?.custom?.description?.substring(0, 30) ||
              (meeting as CallRecording).filename?.substring(0, 30) ||
              "Personal Meeting"
            }
            date={
              (meeting as Call).state?.startsAt?.toLocaleString() ||
              (meeting as CallRecording).start_time?.toLocaleString()
            }
            isPreviousMeeting={type === "ended"}
            myButtonIcon={type === "recordings" ? "/icons/play.svg" : undefined}
            buttonText={type === "recordings" ? "Play" : "Start"}
            link={
              type === "recordings"
                ? (meeting as CallRecording).url
                : `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${
                    (meeting as Call).id
                  }`
            }
            handleClick={
              type === "recordings"
                ? () => router.push(`${(meeting as CallRecording).url}`)
                : () => router.push(`/meeting/${(meeting as Call).id}`)
            }
          />
        ))
      ) : (
        <h1 className="text-xl text-sky-1 font-semibold">{callsFalse}</h1>
      )}
    </div>
  );
};

export default CallList;
