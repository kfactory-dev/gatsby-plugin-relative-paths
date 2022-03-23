import React, { useState, useEffect } from 'react';
export default () => {
  const [foo, setFoo] = useState('Foo');
  useEffect(() => setFoo('Foo Bar'));
  return (
    <div>
      <h3>{foo}</h3>
      <img src={require('../../images/icon.png').default} width="300" />
    </div>
  );
};
