import React from 'react';

export default props => (
    <div className="col-md-3">
        <div className="panel panel-default">
            <div className="panel-body desc-repository">
                <b>{ props.name }</b>
                <p>{ props.description }</p>
            </div>
            <div className="panel-footer">
                <i className="fa fa-star" aria-hidden="true"></i> { props.stargazers_count }
            </div>
        </div>
    </div>
);
