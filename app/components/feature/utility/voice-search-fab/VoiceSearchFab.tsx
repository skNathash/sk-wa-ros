import ImgRender from "~/components/core/img/ImgRender";
import VoiceSearch from "~/components/core/voice-search/VoiceSearch";

type Props = {
  callback?: (args: { action: string; data?: any }) => void;
};

const VoiceSearchFab = ({ callback }: Props) => {
  const handleVoiceSearchCallback = ({
    action,
    data,
  }: {
    action: string;
    data?: any;
  }) => {
    callback && callback({ action, data });
  };

  return (
    <VoiceSearch callback={handleVoiceSearchCallback}>
      <div className="tw:bg-white tw:text-white tw:w-14 tw:h-14 tw:rounded-full tw:shadow-lg tw:flex tw:items-center tw:justify-center tw:cursor-pointer tw:hover:scale-105 tw:transition-transform tw:duration-200 tw:overflow-hidden tw:p-1 tw:border tw:border-blue-800">
        <ImgRender src="/ai/ai-mic.gif" />
      </div>
    </VoiceSearch>
  );
};

export default VoiceSearchFab;
