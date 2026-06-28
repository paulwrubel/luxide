import { Tooltip } from 'flowbite-react';
import { HiInformationCircle } from 'react-icons/hi2';

export type InfoIconAdditionalInfoProps = {
  info: string | string[];
};

export function InfoIconAdditionalInfo(props: InfoIconAdditionalInfoProps) {
  const { info } = props;

  const infoStrings = Array.isArray(info) ? info : [info];
  return (
    <Tooltip
      content={
        <div>
          <h6 className="font-bold">Additional Info</h6>
          {infoStrings.map((str, i) => (
            <p key={i}>{str}</p>
          ))}
        </div>
      }
    >
      <HiInformationCircle className="h-5 w-5 shrink-0" />
    </Tooltip>
  );
}
