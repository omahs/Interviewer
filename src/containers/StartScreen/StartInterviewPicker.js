import React from 'react';
import { useDispatch } from 'react-redux';
import { actionCreators as dialogActions } from '../../ducks/modules/dialogs';
import { importProtocolFromURI } from '../../utils/protocol/importProtocol';
import NewFilterableListWrapper from '../../components/NewFilterableListWrapper';
import { Overlay } from '../Overlay';
import { entityAttributesProperty } from '../../ducks/modules/network';
import { ProtocolCard } from '../../components/Cards';
import useAPI from '../../hooks/useApi';
import { isNull } from 'lodash';

const StartInterviewPicker = ({
  show,
  onClose,
}) => {
  const handleProtocolCardClick = (downloadPath) => {
    importProtocolFromURI(downloadPath, true);
    onClose();
  };

  const { status, error, data: protocolList } = useAPI('protocols');

  const dispatch = useDispatch();
  const openDialog = (dialog) => dispatch(dialogActions.openDialog(dialog));

  const handleApiError = (error) => {
    const errorObject = new Error(error);
    errorObject.friendlyMessage = 'There was an error fetching the protocol list from Server. Consult the error message below for further information. Contact the Network Canvas project team for help with this error.';
    openDialog({
      type: 'Error',
      title: 'Error fetching protocol list from Server',
      error: errorObject,
      confirmLabel: 'Okay',
      onConfirm: () => {
        setLoading(false);
        onClose();
      },
    });
  };

  if (error) {
    handleApiError(error);
  }

  const formattedProtocols = protocolList && protocolList.map((protocol) => {
    const {
      schemaVersion,
      lastModified,
      name,
      description,
      downloadPath,
    } = protocol;

    return {
      [entityAttributesProperty]: {
        schemaVersion,
        lastModified,
        name,
        description,
      },
      onClickHandler: () => handleProtocolCardClick(downloadPath),
    };
  });

  return (
    <Overlay
      show={show}
      onClose={onClose}
      title="Select a Protocol to Use"
      fullheight
    >
      <NewFilterableListWrapper
        ItemComponent={ProtocolCard}
        loading={isNull(protocolList) && isNull(error)}
        items={formattedProtocols}
        propertyPath="attributes"
        initialSortProperty="name"
        initialSortDirection="asc"
        sortableProperties={[
          {
            label: 'Name',
            variable: 'name',
          },
          {
            label: 'Modified',
            variable: 'lastModified',
          },
        ]}
      />
    </Overlay>
  );
};

export default StartInterviewPicker;
