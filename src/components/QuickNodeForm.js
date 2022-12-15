import React, { useState, useEffect, useRef } from 'react';
import cx from 'classnames';
import { Icon } from '@codaco/ui';
import { entityAttributesProperty } from '@codaco/shared-consts';
import Node from '../containers/Node';

const QuickNodeForm = (props) => {
  const {
    show,
    onClick,
    onSubmit,
    onClose,
    disabled,
    nodeType,
    nodeIconName,
    targetVariable,
  } = props;

  const [nodeLabel, setNodeLabel] = useState('');
  const timer = useRef();

  useEffect(() => {
    if (disabled) {
      onClose();
    }
  }, [disabled]);

  const handleBlur = () => {
    if (timer.current) {
      clearTimeout(timer.current);
    }

    timer.current = setTimeout(() => {
      setNodeLabel('');
      onClose();
    }, 500);
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();

    if (nodeLabel.length === 0) {
      return;
    }

    onSubmit({ [targetVariable]: nodeLabel });

    setNodeLabel('');
  };

  const handleSubmitClick = (e) => {
    if (timer.current) {
      clearTimeout(timer.current);
    }

    handleSubmitForm(e);
  };

  const handleChange = (e) => {
    setNodeLabel(e.target.value);
  };

  // Match the node color to the stage subject
  const nodeProps = {
    type: nodeType,
    [entityAttributesProperty]: {
      [targetVariable]: nodeLabel.length === 0 ? ' ' : nodeLabel,
    },
  };

  return (
    <div className={`quick-add ${disabled ? 'quick-add--disabled' : ''}`}>
      <div className={cx('quick-add-form', { 'quick-add-form--show': show })}>
        <form autoComplete="off" onSubmit={handleSubmitForm}>
          {show
            && (
              <input
                className="quick-add-form__label-input"
                key="label"
                autoFocus // eslint-disable-line
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Type a name and press enter..."
                value={nodeLabel}
                type="text"
              />
            )}
        </form>
      </div>
      <div className={cx('flip-button', { 'flip-button--flip': nodeLabel.length > 0 })}>
        <div className="flip-button-inner">
          <div className="flip-button-front" onClick={onClick}>
            <Icon name={nodeIconName} />
          </div>
          <div className="flip-button-back" onClick={handleSubmitClick}>
            <Node {...nodeProps} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickNodeForm;
