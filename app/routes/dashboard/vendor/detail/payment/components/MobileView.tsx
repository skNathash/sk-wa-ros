import MobileViewItem from "./MobileViewItem";

const MobileView = ({
  data,
  callback,
}: {
  data: any[];
  callback: (a: { action: string; data: any }) => void;
}) => {
  return (
    <>
      {data.map((item, idx) => (
        <MobileViewItem key={item._id || idx} data={item} callback={callback} />
      ))}
    </>
  );
};

export default MobileView;
