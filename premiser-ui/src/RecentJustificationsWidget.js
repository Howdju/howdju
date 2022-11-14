import React, { Component } from "react";

import ListEntitiesWidget from "./ListEntitiesWidget";
import CellList from "./CellList";
import JustificationCard from "./JustificationCard";
import t from "./texts";
import { api } from "./actions";
import { justificationsSchema } from "./normalizationSchemas";

export default class RecentJustificationsWidget extends Component {
  justificationToCard = (justification) => {
    const id = this.props.id;
    const cardId = `${id}-justification-${justification.id}`;
    return (
      <JustificationCard
        id={cardId}
        key={cardId}
        justification={justification}
        doShowBasisJustifications={false}
        doShowControls={false}
        className={CellList.largeCellClasses}
      />
    );
  };

  render() {
    const { id, widgetId, ...rest } = this.props;
    return (
      <ListEntitiesWidget
        {...rest}
        id={id}
        widgetId={widgetId}
        cellClasses={CellList.largeCellClasses}
        entitiesWidgetStateKey="recentJustifications"
        fetchEntities={api.fetchRecentJustifications}
        entityToCard={this.justificationToCard}
        entitiesSchema={justificationsSchema}
        emptyEntitiesMessage={t("No recent justifications")}
        loadErrorMessage={t(
          "There was an error fetching the recent justifications."
        )}
      />
    );
  }
}
