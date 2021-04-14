import React, { Component } from 'react';
import { bindActionCreators, compose } from 'redux';
import { connect } from 'react-redux';
import { submit } from 'redux-form';
import { debounce } from 'lodash';
import { Button } from '@codaco/ui';
import Overlay from './Overlay';
import Form from './Form';
import FormWizard from './FormWizard';
import { entityPrimaryKeyProperty, entityAttributesProperty } from '../ducks/modules/network';
import { Scroller } from '../components';

const reduxFormName = 'NODE_FORM';

class NodeForm extends Component {
  constructor(props) {
    super(props);

    this.overlay = React.createRef();
  }

  handleSubmit = debounce((form) => {
    const {
      onSubmit,
      onClose,
    } = this.props;

    onSubmit({ form });
    onClose();
  }, 1000, { // This is needed to prevent double submit.
    leading: true,
    trailing: false,
  })

  render() {
    const {
      show,
      form,
      initialValues,
      submitForm,
      stage,
      onClose,
      useFullScreenForms,
      entityId,
      otherNetworkEntities,
    } = this.props;

    const formProps = {
      ...form,
      initialValues,
      onSubmit: this.handleSubmit,
      autoFocus: true,
      subject: stage.subject,
      form: reduxFormName,
      entityId,
      otherNetworkEntities,
    };

    return (
      <Overlay
        show={show}
        title={form.title}
        onClose={onClose}
        className="node-form"
        footer={(<Button key="submit" aria-label="Submit" type="submit" onClick={submitForm}>Finished</Button>)}
      >
        { useFullScreenForms
          ? (
            <FormWizard
              {...formProps}
            />
          )
          : (
            <>
              <Scroller>
                <Form
                  {...formProps}
                />
              </Scroller>
            </>
          )}
      </Overlay>
    );
  }
}

const mapStateToProps = (state, props) => {
  const nodeAttributes = props.node ? props.node[entityAttributesProperty] : {};

  const initialValues = {
    ...nodeAttributes,
  };

  return {
    form: props.stage.form,
    useFullScreenForms: state.deviceSettings.useFullScreenForms,
    initialValues,
    entityId: props.node && props.node[entityPrimaryKeyProperty], // used for validation functions
  };
};

const mapDispatchToProps = (dispatch) => ({
  submitForm: bindActionCreators(() => submit(reduxFormName), dispatch),
});

export { NodeForm };

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
)(NodeForm);
