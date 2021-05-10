import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { get } from 'lodash';
import { SessionCard } from '@codaco/ui/lib/components/Cards';
import { actionCreators as sessionActions } from '../../ducks/modules/session';
import NewFilterableListWrapper from '../../components/NewFilterableListWrapper';
import { Overlay } from '../Overlay';
import formatDatestamp from '../../utils/formatDatestamp';

const oneBasedIndex = (i) => parseInt(i || 0, 10) + 1;

const ResumeSessionPicker = ({
  show,
  onClose,
}) => {
  const dispatch = useDispatch();
  const setSession = (sessionUID) => dispatch(sessionActions.setSession(sessionUID));

  const sessions = useSelector((state) => state.sessions);
  const protocols = useSelector((state) => state.protocols);

  const handleSessionCardClick = (sessionUUID) => {
    setSession(sessionUUID);
    onClose();
  };

  const formattedSessions = sessions && sessions.map((session) => {
    const protocol = get(protocols, [session.protocolUID]);

    const progress = Math.round(
      (oneBasedIndex(session.stageIndex) / oneBasedIndex(protocol.stages.length)) * 100,
    );

    return {
      caseId: session.caseId,
      startedAt: formatDatestamp(session.startedAt),
      updatedAt: formatDatestamp(session.updatedAt),
      finishedAt: formatDatestamp(session.finishedAt),
      exportedAt: formatDatestamp(session.exportedAt),
      protocolName: protocol.name,
      progress,
      onClickHandler: () => handleSessionCardClick(session._id),
    };
  });

  return (
    <Overlay
      show={show}
      onClose={onClose}
      title="Select an Interview to Resume"
      fullheight
    >
      <NewFilterableListWrapper
        ItemComponent={SessionCard}
        items={formattedSessions}
        propertyPath={null}
        initialSortProperty="updatedAt"
        initialSortDirection="desc"
        sortableProperties={[
          {
            label: 'Last Changed',
            variable: 'updatedAt',
          },
          {
            label: 'Case ID',
            variable: 'caseId',
          },
          {
            label: 'Progress',
            variable: 'progress',
          },
        ]}
      />
    </Overlay>
  );
};

export default ResumeSessionPicker;
